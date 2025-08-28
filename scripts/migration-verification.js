// Migration verification script
// Run this in the browser console to check migration status

async function checkMigrationStatus() {
  try {
    const response = await fetch('/api/migration/status?checkLocalStorage=true');
    const status = await response.json();
    
    console.log('Migration Status:', status);
    
    if (status.needsMigration) {
      console.log('Migration needed! localStorage data found:', status.localStorageCounts);
      console.log('Database counts:', status.databaseCounts);
      
      // Show migration prompt
      console.log('To migrate your data:');
      console.log('1. Go to the dashboard');
      console.log('2. Look for migration prompts');
      console.log('3. Or manually trigger migration');
    } else {
      console.log('No migration needed. All data is in the database.');
    }
    
    return status;
  } catch (error) {
    console.error('Failed to check migration status:', error);
  }
}

// Manual migration function
async function triggerMigration() {
  try {
    console.log('Triggering manual migration...');
    
    // Get localStorage data
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
    const testMarks = JSON.parse(localStorage.getItem('testMarks') || '[]');
    
    console.log('Found data to migrate:', {
      subjects: subjects.length,
      tasks: tasks.length,
      studySessions: studySessions.length,
      testMarks: testMarks.length
    });
    
    // Migrate subjects
    for (const subject of subjects) {
      try {
        const response = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: subject.name,
            color: subject.color || '#3B82F6',
            description: subject.description || '',
            progress: subject.progress || 0,
            totalChapters: subject.totalChapters || 0,
            completedChapters: subject.completedChapters || 0
          })
        });
        
        if (response.ok) {
          console.log(`✅ Migrated subject: ${subject.name}`);
        } else {
          console.error(`❌ Failed to migrate subject: ${subject.name}`);
        }
      } catch (error) {
        console.error(`❌ Error migrating subject ${subject.name}:`, error);
      }
    }
    
    // Migrate tasks
    for (const task of tasks) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description || '',
            subjectId: task.subjectId || null,
            priority: task.priority || 'medium',
            status: task.status || 'pending',
            dueDate: task.dueDate || null,
            progress: task.progress || 0,
            timeSpent: task.timeSpent || 0,
            category: task.category || 'General',
            estimatedTime: task.estimatedTime || 0
          })
        });
        
        if (response.ok) {
          console.log(`✅ Migrated task: ${task.title}`);
        } else {
          console.error(`❌ Failed to migrate task: ${task.title}`);
        }
      } catch (error) {
        console.error(`❌ Error migrating task ${task.title}:`, error);
      }
    }
    
    console.log('Migration completed! Check the results above.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the check
console.log('🔍 Migration Verification Script Loaded');
console.log('Available functions:');
console.log('- checkMigrationStatus() - Check current migration status');
console.log('- triggerMigration() - Manually trigger migration');

checkMigrationStatus();
