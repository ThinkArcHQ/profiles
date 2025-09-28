/**
 * Integration Test Runner
 * 
 * This script runs all integration tests for the MVP functionality,
 * providing comprehensive coverage of the requirements.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  path: string;
  requirements: string[];
  description: string;
}

const testSuites: TestSuite[] = [
  {
    name: 'API Integration Tests',
    path: 'src/app/api/__tests__/integration.test.ts',
    requirements: ['1.3', '2.1', '2.2', '4.1', '4.2'],
    description: 'Comprehensive API endpoint integration testing',
  },
  {
    name: 'MCP Comprehensive Tests',
    path: 'src/app/api/mcp/__tests__/mcp-comprehensive.test.ts',
    requirements: ['4.1', '4.2', '2.1', '2.2'],
    description: 'MCP endpoint compatibility and security testing',
  },
  {
    name: 'Privacy Integration Tests',
    path: 'src/app/api/__tests__/privacy-integration.test.ts',
    requirements: ['2.1', '2.2', '2.3', '2.4', '2.5'],
    description: 'Privacy controls across all features',
  },
  {
    name: 'Slug Service Concurrent Tests',
    path: 'src/lib/services/__tests__/slug-service.concurrent.test.ts',
    requirements: ['1.3', '1.1', '1.2'],
    description: 'Slug generation under concurrent usage',
  },
  {
    name: 'Existing MCP Integration Tests',
    path: 'src/app/api/mcp/__tests__/mcp-integration.test.ts',
    requirements: ['4.1', '4.2'],
    description: 'Basic MCP endpoint validation',
  },
  {
    name: 'Search Integration Tests',
    path: 'src/app/api/search/__tests__/integration.test.ts',
    requirements: ['2.2', '2.3', '6.1', '6.2', '6.3'],
    description: 'Search API privacy and performance',
  },
  {
    name: 'Profile API Tests',
    path: 'src/app/api/profiles/__tests__/route.test.ts',
    requirements: ['1.1', '1.2', '2.1', '5.1'],
    description: 'Profile creation and management',
  },
  {
    name: 'Error Handling Tests',
    path: 'src/app/api/__tests__/error-handling.test.ts',
    requirements: ['4.5', '6.4'],
    description: 'Comprehensive error handling system',
  },
];

function runTestSuite(suite: TestSuite): { success: boolean; output: string; duration: number } {
  const startTime = Date.now();
  
  try {
    console.log(`\n🧪 Running: ${suite.name}`);
    console.log(`📋 Requirements: ${suite.requirements.join(', ')}`);
    console.log(`📝 Description: ${suite.description}`);
    
    if (!existsSync(path.join(process.cwd(), suite.path))) {
      console.log(`⚠️  Test file not found: ${suite.path}`);
      return { success: false, output: 'Test file not found', duration: 0 };
    }
    
    const output = execSync(`npm test -- --run ${suite.path}`, {
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 60000, // 60 second timeout per test suite
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Passed in ${duration}ms`);
    
    return { success: true, output, duration };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`❌ Failed in ${duration}ms`);
    console.log(`Error: ${error.message}`);
    
    return { success: false, output: error.stdout || error.message, duration };
  }
}

function generateTestReport(results: Array<{ suite: TestSuite; result: ReturnType<typeof runTestSuite> }>) {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.result.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.result.duration, 0);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 INTEGRATION TEST REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📈 Summary:`);
  console.log(`   Total Test Suites: ${totalTests}`);
  console.log(`   Passed: ${passedTests} ✅`);
  console.log(`   Failed: ${failedTests} ❌`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`   Total Duration: ${totalDuration}ms`);
  
  console.log(`\n📋 Requirements Coverage:`);
  const allRequirements = new Set<string>();
  const coveredRequirements = new Set<string>();
  
  results.forEach(({ suite, result }) => {
    suite.requirements.forEach(req => {
      allRequirements.add(req);
      if (result.success) {
        coveredRequirements.add(req);
      }
    });
  });
  
  const sortedRequirements = Array.from(allRequirements).sort();
  sortedRequirements.forEach(req => {
    const status = coveredRequirements.has(req) ? '✅' : '❌';
    console.log(`   Requirement ${req}: ${status}`);
  });
  
  console.log(`\n📝 Detailed Results:`);
  results.forEach(({ suite, result }) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${suite.name} (${result.duration}ms)`);
    if (!result.success) {
      console.log(`      Requirements affected: ${suite.requirements.join(', ')}`);
    }
  });
  
  if (failedTests > 0) {
    console.log(`\n⚠️  ${failedTests} test suite(s) failed. Please review the output above.`);
    console.log(`   Failed suites may indicate issues with:`);
    
    const failedRequirements = new Set<string>();
    results.forEach(({ suite, result }) => {
      if (!result.success) {
        suite.requirements.forEach(req => failedRequirements.add(req));
      }
    });
    
    Array.from(failedRequirements).sort().forEach(req => {
      console.log(`   - Requirement ${req}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  return { totalTests, passedTests, failedTests, totalDuration };
}

async function main() {
  console.log('🚀 Starting Integration Test Suite');
  console.log('Testing MVP functionality requirements...\n');
  
  const results: Array<{ suite: TestSuite; result: ReturnType<typeof runTestSuite> }> = [];
  
  for (const suite of testSuites) {
    const result = runTestSuite(suite);
    results.push({ suite, result });
    
    // Add small delay between test suites
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const report = generateTestReport(results);
  
  // Exit with error code if any tests failed
  if (report.failedTests > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All integration tests passed!');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { testSuites, runTestSuite, generateTestReport };