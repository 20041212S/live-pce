import { prisma } from './prisma';

/**
 * Adaptive Learning Engine
 * 
 * This module enables the chatbot to learn from admin-provided knowledge base entries
 * and improve its understanding over time.
 */

interface LearnedPattern {
  keywords: string[];
  relatedTerms: string[];
  knowledgeIds: string[];
  usageCount: number;
  lastUsed: Date;
}

interface KnowledgeRelationship {
  sourceId: string;
  targetId: string;
  relationshipType: 'similar' | 'related' | 'follows';
  strength: number;
}

// In-memory cache for learned patterns (could be persisted to DB in future)
let learnedPatterns: Map<string, LearnedPattern> = new Map();
let knowledgeRelationships: Map<string, KnowledgeRelationship[]> = new Map();
let dynamicSynonyms: Map<string, Set<string>> = new Map();

/**
 * Extract keywords and important terms from knowledge base entry
 */
function extractKeywords(text: string, name: string): string[] {
  const combined = `${name} ${text}`.toLowerCase();
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'what', 'which', 'who', 'where', 'when', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'into',
    'can', 'will', 'would', 'could', 'should', 'may', 'might', 'must'
  ]);
  
  // Extract meaningful words (3+ characters, not stop words)
  const words = combined
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.has(w));
  
  // Count word frequency
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Return top keywords (words that appear multiple times or are in the name)
  const nameWords = new Set(name.toLowerCase().split(/\s+/).filter(w => w.length >= 3));
  const keywords = Array.from(wordFreq.entries())
    .filter(([word, count]) => count >= 2 || nameWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
  
  return keywords;
}

/**
 * Find related terms by analyzing knowledge base content
 */
function findRelatedTerms(knowledgeEntries: any[]): Map<string, Set<string>> {
  const termCooccurrence = new Map<string, Map<string, number>>();
  
  knowledgeEntries.forEach(entry => {
    const keywords = extractKeywords(entry.text, entry.name);
    
    // Build co-occurrence matrix
    keywords.forEach((word1, i) => {
      if (!termCooccurrence.has(word1)) {
        termCooccurrence.set(word1, new Map());
      }
      const cooccur = termCooccurrence.get(word1)!;
      
      keywords.forEach((word2, j) => {
        if (i !== j) {
          cooccur.set(word2, (cooccur.get(word2) || 0) + 1);
        }
      });
    });
  });
  
  // Build synonym/related term map
  const relatedTerms = new Map<string, Set<string>>();
  const threshold = 2; // Minimum co-occurrence to consider terms related
  
  termCooccurrence.forEach((cooccur, term) => {
    const related = new Set<string>();
    cooccur.forEach((count, otherTerm) => {
      if (count >= threshold) {
        related.add(otherTerm);
        // Also add reverse relationship
        if (!relatedTerms.has(otherTerm)) {
          relatedTerms.set(otherTerm, new Set());
        }
        relatedTerms.get(otherTerm)!.add(term);
      }
    });
    if (related.size > 0) {
      relatedTerms.set(term, related);
    }
  });
  
  return relatedTerms;
}

/**
 * Build relationships between knowledge entries
 */
function buildKnowledgeRelationships(knowledgeEntries: any[]): Map<string, KnowledgeRelationship[]> {
  const relationships = new Map<string, KnowledgeRelationship[]>();
  
  knowledgeEntries.forEach((entry1, i) => {
    const entry1Keywords = new Set(extractKeywords(entry1.text, entry1.name));
    const entry1Relations: KnowledgeRelationship[] = [];
    
    knowledgeEntries.forEach((entry2, j) => {
      if (i === j) return;
      
      const entry2Keywords = new Set(extractKeywords(entry2.text, entry2.name));
      
      // Calculate similarity (Jaccard similarity)
      const intersection = new Set([...entry1Keywords].filter(x => entry2Keywords.has(x)));
      const union = new Set([...entry1Keywords, ...entry2Keywords]);
      const similarity = intersection.size / union.size;
      
      if (similarity > 0.2) { // 20% similarity threshold
        entry1Relations.push({
          sourceId: entry1.id,
          targetId: entry2.id,
          relationshipType: similarity > 0.5 ? 'similar' : 'related',
          strength: similarity,
        });
      }
    });
    
    // Sort by strength and keep top 5
    entry1Relations.sort((a, b) => b.strength - a.strength);
    relationships.set(entry1.id, entry1Relations.slice(0, 5));
  });
  
  return relationships;
}

/**
 * Learn from all knowledge base entries
 * This should be called periodically or when new knowledge is added
 */
export async function learnFromKnowledgeBase() {
  try {
    console.log('🧠 Learning from knowledge base...');
    
    // Fetch all knowledge entries
    const allKnowledge = await prisma.knowledge.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    
    if (allKnowledge.length === 0) {
      console.log('No knowledge entries to learn from');
      return;
    }
    
    // Extract patterns for each knowledge entry
    const newPatterns = new Map<string, LearnedPattern>();
    
    allKnowledge.forEach(entry => {
      const keywords = extractKeywords(entry.text, entry.name);
      const type = entry.type.toLowerCase();
      
      // Create or update pattern
      const patternKey = `${type}:${entry.name.toLowerCase()}`;
      const existingPattern = learnedPatterns.get(patternKey);
      
      newPatterns.set(patternKey, {
        keywords,
        relatedTerms: [],
        knowledgeIds: existingPattern 
          ? [...existingPattern.knowledgeIds, entry.id]
          : [entry.id],
        usageCount: existingPattern?.usageCount || 0,
        lastUsed: existingPattern?.lastUsed || new Date(),
      });
    });
    
    // Find related terms across all knowledge
    const relatedTerms = findRelatedTerms(allKnowledge);
    dynamicSynonyms = relatedTerms;
    
    // Build knowledge relationships
    const relationships = buildKnowledgeRelationships(allKnowledge);
    knowledgeRelationships = relationships;
    
    // Update learned patterns
    learnedPatterns = newPatterns;
    
    console.log(`✅ Learned from ${allKnowledge.length} knowledge entries`);
    console.log(`   - Extracted ${newPatterns.size} patterns`);
    console.log(`   - Found ${relatedTerms.size} term relationships`);
    console.log(`   - Built ${Array.from(relationships.values()).flat().length} knowledge relationships`);
    
    return {
      patternsLearned: newPatterns.size,
      relationshipsFound: Array.from(relationships.values()).flat().length,
      termsLearned: relatedTerms.size,
    };
  } catch (error) {
    console.error('Error learning from knowledge base:', error);
    return null;
  }
}

/**
 * Get dynamically learned synonyms for a term
 */
export function getLearnedSynonyms(term: string): string[] {
  const lowerTerm = term.toLowerCase();
  const synonyms = dynamicSynonyms.get(lowerTerm);
  return synonyms ? Array.from(synonyms) : [];
}

/**
 * Get related knowledge entries based on learned relationships
 */
export function getRelatedKnowledge(knowledgeId: string, limit = 3): string[] {
  const relationships = knowledgeRelationships.get(knowledgeId);
  if (!relationships || relationships.length === 0) {
    return [];
  }
  
  // Sort by strength and return top related IDs
  return relationships
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)
    .map(rel => rel.targetId);
}

/**
 * Update usage statistics when knowledge is used
 */
export function recordKnowledgeUsage(knowledgeId: string, query: string) {
  // Find matching pattern
  for (const [patternKey, pattern] of learnedPatterns.entries()) {
    if (pattern.knowledgeIds.includes(knowledgeId)) {
      pattern.usageCount++;
      pattern.lastUsed = new Date();
      
      // Extract query terms and add to related terms if not already present
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
      queryWords.forEach(word => {
        if (!pattern.relatedTerms.includes(word)) {
          pattern.relatedTerms.push(word);
        }
      });
      
      break;
    }
  }
}

/**
 * Get learned patterns for a query
 */
export function getLearnedPatterns(query: string): LearnedPattern[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length >= 3);
  
  const matchingPatterns: LearnedPattern[] = [];
  
  learnedPatterns.forEach((pattern, key) => {
    // Check if query matches pattern keywords or related terms
    const matches = pattern.keywords.some(kw => queryWords.some(qw => qw.includes(kw) || kw.includes(qw))) ||
                   pattern.relatedTerms.some(rt => queryWords.some(qw => qw.includes(rt) || rt.includes(qw)));
    
    if (matches) {
      matchingPatterns.push(pattern);
    }
  });
  
  // Sort by usage count (more used = more relevant)
  matchingPatterns.sort((a, b) => b.usageCount - a.usageCount);
  
  return matchingPatterns;
}

// Lazy initialization flag
let isInitialized = false;
let initializationPromise: Promise<any> | null = null;

/**
 * Initialize learning on startup (lazy - only runs once)
 */
export async function initializeLearning() {
  if (isInitialized) {
    return;
  }
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log('🚀 Initializing adaptive learning engine...');
      await learnFromKnowledgeBase();
      isInitialized = true;
      console.log('✅ Learning engine ready');
    } catch (error) {
      console.error('Error initializing learning engine:', error);
      initializationPromise = null; // Allow retry
    }
  })();
  
  return initializationPromise;
}

/**
 * Ensure learning is initialized (called automatically when needed)
 */
export async function ensureInitialized() {
  if (!isInitialized && !initializationPromise) {
    await initializeLearning();
  }
  return initializationPromise;
}

