import { prisma } from './prisma';
import { 
  getLearnedSynonyms, 
  getRelatedKnowledge, 
  recordKnowledgeUsage,
  getLearnedPatterns,
  ensureInitialized 
} from './learningEngine';

// Common stop words to ignore in search
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
  'just', 'don', 'should', 'now', 'hi', 'hello', 'hey', 'tell', 'me', 'please', 'thanks'
]);

// Synonym mapping for better matching
const SYNONYMS: { [key: string]: string[] } = {
  'admission': ['admit', 'enroll', 'enrollment', 'apply', 'application', 'entry'],
  'fee': ['fees', 'tuition', 'payment', 'cost', 'price', 'charges', 'amount'],
  'faculty': ['faculties', 'teacher', 'teachers', 'professor', 'professors', 'staff', 'hod'],
  'department': ['dept', 'branch', 'program', 'course'],
  'room': ['classroom', 'lab', 'laboratory', 'hall', 'office'],
  'cse': ['computer science', 'cs', 'computer'],
  'me': ['mechanical', 'mechanical engineering'],
  'ee': ['electrical', 'electrical engineering'],
  'location': ['where', 'place', 'address', 'directions'],
  'contact': ['phone', 'email', 'reach', 'call'],
};

/**
 * Expand query with synonyms for better matching
 * Now includes dynamically learned synonyms from knowledge base
 */
function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expanded: string[] = [query.toLowerCase()];
  
  words.forEach(word => {
    // Add original word
    if (word.length > 2 && !STOP_WORDS.has(word)) {
      expanded.push(word);
    }
    
    // Add static synonyms
    for (const [key, synonyms] of Object.entries(SYNONYMS)) {
      if (word === key || synonyms.includes(word)) {
        expanded.push(...synonyms);
        expanded.push(key);
      }
    }
    
    // Add dynamically learned synonyms from knowledge base
    const learnedSynonyms = getLearnedSynonyms(word);
    if (learnedSynonyms.length > 0) {
      expanded.push(...learnedSynonyms);
    }
  });
  
  return [...new Set(expanded)]; // Remove duplicates
}

/**
 * Calculate relevance score for a knowledge entry
 */
function calculateRelevance(item: any, queryWords: string[], expandedTerms: string[]): number {
  const textLower = item.text.toLowerCase();
  const nameLower = item.name.toLowerCase();
  const sourceLower = item.source.toLowerCase();
  const typeLower = item.type.toLowerCase();
  const combinedText = `${nameLower} ${textLower} ${sourceLower} ${typeLower}`;
  
  let score = 0;
  let exactMatches = 0;
  let wordMatches = 0;
  
  // Check for exact phrase match (highest priority)
  const exactPhrase = queryWords.join(' ');
  if (combinedText.includes(exactPhrase)) {
    score += 50;
    exactMatches++;
  }
  
  // Check each query word
  queryWords.forEach(word => {
    if (word.length < 2) return;
    
    // Exact word match in name (highest weight)
    if (nameLower.includes(word)) {
      score += 10;
      wordMatches++;
    }
    
    // Exact word match in text
    const wordCount = (textLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    score += wordCount * 3;
    if (wordCount > 0) wordMatches++;
    
    // Match in source/type
    if (sourceLower.includes(word) || typeLower.includes(word)) {
      score += 2;
    }
  });
  
  // Check expanded terms (synonyms)
  expandedTerms.forEach(term => {
    if (term.length < 2) return;
    if (combinedText.includes(term)) {
      score += 1;
    }
  });
  
  // Boost score for recent entries (admin-provided content is usually recent)
  const daysSinceUpdate = (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 30) {
    score += 5; // Recent content gets a boost
  }
  
  // Boost score if multiple words match
  if (wordMatches >= queryWords.length * 0.5) {
    score += 10; // Good overall match
  }
  
  return score;
}

export async function searchKnowledge(query: string, limit = 5) {
  // Ensure learning engine is initialized
  await ensureInitialized();
  
  if (!query || !query.trim()) {
    // Return recent knowledge entries for generic queries
    const results = await prisma.knowledge.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return results;
  }

  // Clean and expand query
  const cleanQuery = query.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 0 && !STOP_WORDS.has(w))
    .join(' ')
    .trim();
  
  if (!cleanQuery) {
    // If query is too generic, get recent knowledge entries
    const results = await prisma.knowledge.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return results;
  }

  // Get all knowledge entries for comprehensive search
  const allKnowledge = await prisma.knowledge.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 200, // Get more entries for better matching
  });

  // Extract meaningful words from query
  const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
  const expandedTerms = expandQuery(cleanQuery);

  // Calculate relevance for each entry
  const scored = allKnowledge.map(item => ({
    ...item,
    score: calculateRelevance(item, queryWords, expandedTerms),
  }));

  // Filter out entries with zero score and sort by relevance
  const relevant = scored
    .filter(item => item.score > 0)
    .sort((a, b) => {
      // Sort by score (descending), then by recency
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, limit)
    .map(({ score, ...item }) => item);

  // If no relevant results, try using learned patterns
  if (relevant.length === 0) {
    const learnedPatterns = getLearnedPatterns(query);
    if (learnedPatterns.length > 0) {
      // Get knowledge IDs from learned patterns
      const patternKnowledgeIds = learnedPatterns
        .flatMap(p => p.knowledgeIds)
        .slice(0, limit);
      
      const patternResults = allKnowledge.filter(k => 
        patternKnowledgeIds.includes(k.id)
      );
      
      if (patternResults.length > 0) {
        return patternResults;
      }
    }
    
    // Final fallback: return recent entries
    return allKnowledge.slice(0, limit);
  }

  // Record usage for learning
  relevant.forEach(item => {
    recordKnowledgeUsage(item.id, query);
  });

  // Add related knowledge entries based on learned relationships
  const enhancedResults = [...relevant];
  if (relevant.length > 0 && enhancedResults.length < limit) {
    const topResult = relevant[0];
    const relatedIds = getRelatedKnowledge(topResult.id, limit - enhancedResults.length);
    const relatedEntries = allKnowledge.filter(k => 
      relatedIds.includes(k.id) && !enhancedResults.some(r => r.id === k.id)
    );
    enhancedResults.push(...relatedEntries);
  }

  return enhancedResults.slice(0, limit);
}

