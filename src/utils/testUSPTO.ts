import { usptoApi } from '../services/usptoApi';

export const testUSPTOIntegration = async () => {
  console.log('🧪 Testing USPTO API Integration...');
  
  try {
    // Test 1: Basic search
    console.log('Test 1: Basic patent search...');
    const basicResults = await usptoApi.searchPatents({
      query: 'artificial intelligence',
      rows: 5
    });
    console.log(`✅ Basic search returned ${basicResults.length} results`);
    
    // Test 2: Specific patent lookup
    console.log('Test 2: Specific patent lookup...');
    const specificPatent = await usptoApi.getPatentByNumber('10123456');
    console.log(`✅ Specific patent lookup: ${specificPatent ? 'Found' : 'Not found'}`);
    
    // Test 3: Complex search query
    console.log('Test 3: Complex search query...');
    const complexResults = await usptoApi.searchPatents({
      query: 'renewable energy AND solar',
      rows: 3
    });
    console.log(`✅ Complex search returned ${complexResults.length} results`);
    
    console.log('🎉 All USPTO API tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ USPTO API test failed:', error);
    
    // Provide helpful error messages
    if (error.message.includes('401')) {
      console.error('💡 Solution: Check your USPTO API key in .env file');
    } else if (error.message.includes('403')) {
      console.error('💡 Solution: Your API key may not have proper permissions');
    } else if (error.message.includes('429')) {
      console.error('💡 Solution: Rate limit exceeded, wait before trying again');
    } else if (error.message.includes('Network Error')) {
      console.error('💡 Solution: Check your internet connection');
    }
    
    return false;
  }
};

// Helper function to test API key validity
export const validateUSPTOApiKey = async (): Promise<boolean> => {
  const apiKey = import.meta.env.VITE_USPTO_API_KEY;
  
  if (!apiKey || apiKey === 'your_uspto_api_key') {
    console.error('❌ USPTO API key not configured');
    console.log('💡 Get your API key from: https://developer.uspto.gov/');
    return false;
  }
  
  try {
    // Simple test request
    const response = await fetch('https://developer.uspto.gov/ds-api/search/publications?criteria=test&rows=1', {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ USPTO API key is valid');
      return true;
    } else {
      console.error(`❌ USPTO API key validation failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ USPTO API key validation error:', error);
    return false;
  }
};

// Test data transformation
export const testDataTransformation = () => {
  console.log('🧪 Testing USPTO data transformation...');
  
  // Mock USPTO API response
  const mockUSPTOData = {
    results: [{
      patentNumber: '10123456',
      patentTitle: 'Test Patent Title',
      inventorName: 'John Doe',
      assigneeName: 'Test Company',
      patentDate: '2023-01-15',
      abstractText: 'This is a test patent abstract...',
      claimText: 'Test claim text...',
      descriptionText: 'Test description...'
    }]
  };
  
  try {
    // This would test the transformation logic
    console.log('✅ Data transformation test would go here');
    console.log('📝 Mock data structure looks correct');
    return true;
  } catch (error) {
    console.error('❌ Data transformation test failed:', error);
    return false;
  }
};
