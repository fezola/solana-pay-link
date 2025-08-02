import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { testSupabaseConnection, testMerchantCreation } from '../lib/supabase-test'

export const SupabaseTest = () => {
  const [testResults, setTestResults] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const runConnectionTest = async () => {
    setIsLoading(true)
    setTestResults('Testing Supabase connection...\n')
    
    try {
      const result = await testSupabaseConnection()
      setTestResults(prev => prev + `Connection test: ${result.success ? 'SUCCESS' : 'FAILED'}\n`)
      if (result.error) {
        setTestResults(prev => prev + `Error: ${result.error}\n`)
      }
    } catch (error) {
      setTestResults(prev => prev + `Connection test failed: ${error}\n`)
    }
    
    setIsLoading(false)
  }

  const runMerchantTest = async () => {
    setIsLoading(true)
    setTestResults(prev => prev + '\nTesting merchant creation...\n')
    
    try {
      const testWallet = 'HH6V2MRkEbVaYwsas3YrxuhKFKWW1wvp6kbX51SA8UoU'
      const result = await testMerchantCreation(testWallet, 'Test Business')
      setTestResults(prev => prev + `Merchant test: ${result.success ? 'SUCCESS' : 'FAILED'}\n`)
      if (result.error) {
        setTestResults(prev => prev + `Error: ${result.error}\n`)
      }
      if (result.data) {
        setTestResults(prev => prev + `Created merchant ID: ${result.data.id}\n`)
      }
    } catch (error) {
      setTestResults(prev => prev + `Merchant test failed: ${error}\n`)
    }
    
    setIsLoading(false)
  }

  const clearResults = () => {
    setTestResults('')
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>
          Test the connection to your Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runConnectionTest} 
            disabled={isLoading}
            variant="outline"
          >
            Test Connection
          </Button>
          <Button 
            onClick={runMerchantTest} 
            disabled={isLoading}
            variant="outline"
          >
            Test Merchant Creation
          </Button>
          <Button 
            onClick={clearResults} 
            disabled={isLoading}
            variant="ghost"
          >
            Clear
          </Button>
        </div>
        
        {testResults && (
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {testResults}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
