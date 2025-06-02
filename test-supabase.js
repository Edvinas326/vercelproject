// Test Supabase connection
import supabase from '/supabase-config.js';

async function testSupabaseConnection() {
    try {
        // Test 1: Check if we can connect to Supabase
        console.log('Testing Supabase connection...');
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        console.log('Connection test result:', {
            success: !testError,
            error: testError ? testError.message : null,
            data: testData
        });

        // Test 2: Try to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Session test result:', {
            hasSession: !!session,
            error: sessionError ? sessionError.message : null
        });

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testSupabaseConnection(); 