#!/bin/bash

# Setup script for local PostgreSQL database

echo "🔧 Setting up local PostgreSQL database for Campus Assistant..."

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running. Starting PostgreSQL..."
    sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null
    
    # Wait a moment for PostgreSQL to start
    sleep 2
    
    if ! pg_isready > /dev/null 2>&1; then
        echo "❌ Failed to start PostgreSQL. Please start it manually:"
        echo "   sudo systemctl start postgresql"
        echo "   or"
        echo "   sudo service postgresql start"
        exit 1
    fi
fi

echo "✅ PostgreSQL is running"

# Database name
DB_NAME="campus_assistant"
DB_USER="${USER}"  # Use current system user

# Try to connect as postgres user first
if sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
    echo "📦 Creating database '$DB_NAME'..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "   Database may already exist (that's okay)"
    
    echo "👤 Creating user '$DB_USER' (if needed)..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_USER';" 2>/dev/null || echo "   User may already exist (that's okay)"
    
    echo "🔐 Granting privileges..."
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
    sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null
    
    echo "✅ Database setup complete!"
    echo ""
    echo "📝 DATABASE_URL for .env file:"
    echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_USER@localhost:5432/$DB_NAME\""
    echo ""
else
    echo "⚠️  Could not connect as postgres user. Using current user instead..."
    echo "📦 Creating database '$DB_NAME'..."
    createdb $DB_NAME 2>/dev/null || echo "   Database may already exist (that's okay)"
    
    echo "✅ Database setup complete!"
    echo ""
    echo "📝 DATABASE_URL for .env file:"
    echo "DATABASE_URL=\"postgresql://$DB_USER@localhost:5432/$DB_NAME\""
    echo ""
fi

