import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Code, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function WebhooksDoc() {
  const [, setLocation] = useLocation();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    nodejs: `// Node.js + Express Example
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Verify webhook signature
function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

app.post('/webhooks/codex-pay', (req, res) => {
  const signature = req.headers['x-codex-signature'];
  const secret = process.env.CODEX_PAY_WEBHOOK_SECRET;
  
  // Verify signature
  const payload = JSON.stringify(req.body);
  if (!verifySignature(payload, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body;
  
  // Handle different event types
  switch (event.type) {
    case 'payment.succeeded':
      console.log('Payment succeeded:', event.data);
      // Update order status, send confirmation email, etc.
      break;
      
    case 'payment.failed':
      console.log('Payment failed:', event.data);
      // Notify customer, retry logic, etc.
      break;
      
    case 'refund.processed':
      console.log('Refund processed:', event.data);
      // Update database, notify customer
      break;
      
    default:
      console.log('Unhandled event type:', event.type);
  }
  
  res.status(200).send('Webhook received');
});

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});`,
    
    python: `# Python + Flask Example
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)

WEBHOOK_SECRET = 'your_webhook_secret_here'

def verify_signature(payload, signature):
    """Verify the webhook signature"""
    expected_sig = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_sig, signature)

@app.route('/webhooks/codex-pay', methods=['POST'])
def codex_pay_webhook():
    signature = request.headers.get('X-Codex-Signature')
    payload = request.get_data()
    
    # Verify signature
    if not verify_signature(payload, signature):
        return jsonify({'error': 'Invalid signature'}), 401
    
    event = request.get_json()
    
    # Handle different event types
    if event['type'] == 'payment.succeeded':
        print(f"Payment succeeded: {event['data']}")
        # Update order, send confirmation email
        
    elif event['type'] == 'payment.failed':
        print(f"Payment failed: {event['data']}")
        # Notify customer, retry logic
        
    elif event['type'] == 'refund.processed':
        print(f"Refund processed: {event['data']}")
        # Update database, notify customer
    
    return jsonify({'status': 'received'}), 200

if __name__ == '__main__':
    app.run(port=5000)`,

    php: `<?php
// PHP Example

$webhookSecret = 'your_webhook_secret_here';

// Get raw POST data
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_CODEX_SIGNATURE'] ?? '';

// Verify signature
$expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);

if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(401);
    exit('Invalid signature');
}

// Decode JSON payload
$event = json_decode($payload, true);

// Handle different event types
switch ($event['type']) {
    case 'payment.succeeded':
        error_log('Payment succeeded: ' . json_encode($event['data']));
        // Update order status, send confirmation email
        break;
        
    case 'payment.failed':
        error_log('Payment failed: ' . json_encode($event['data']));
        // Notify customer, retry logic
        break;
        
    case 'refund.processed':
        error_log('Refund processed: ' . json_encode($event['data']));
        // Update database, notify customer
        break;
        
    default:
        error_log('Unhandled event: ' . $event['type']);
}

http_response_code(200);
echo 'Webhook received';
?>`,

    curl: `# Testing with cURL

# Test webhook endpoint
curl -X POST https://your-server.com/webhooks/codex-pay \\
  -H "Content-Type: application/json" \\
  -H "X-Codex-Signature: your_signature_here" \\
  -d '{
    "type": "payment.succeeded",
    "data": {
      "id": "pay_abc123",
      "amount": 99.99,
      "currency": "USD",
      "merchant_id": "mch_xyz789",
      "customer_email": "customer@example.com",
      "status": "completed",
      "created_at": "2025-10-31T12:00:00Z"
    }
  }'`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button 
          onClick={() => setLocation("/codex-pay")}
          variant="ghost" 
          className="mb-8 text-purple-400 hover:text-purple-300"
          data-testid="button-back-codex-pay"
        >
          ← Back to CODEX Pay
        </Button>

        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Webhooks Documentation</h1>
          <p className="text-xl text-gray-400">Real-time event notifications for CODEX Pay payments</p>
        </div>

        {/* Introduction */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">What are Webhooks?</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <p>
              Webhooks allow CODEX Pay to notify your application in real-time when events happen in your account.
              For example, when a payment succeeds, fails, or a refund is processed.
            </p>
            <p>
              Instead of polling our API constantly, webhooks push updates to your server automatically.
            </p>
          </CardContent>
        </Card>

        {/* Event Types */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Event Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  event: "payment.succeeded",
                  description: "A payment has been successfully processed and confirmed on the blockchain"
                },
                {
                  event: "payment.failed",
                  description: "A payment attempt failed (insufficient funds, network error, etc.)"
                },
                {
                  event: "payment.pending",
                  description: "A payment is waiting for blockchain confirmation"
                },
                {
                  event: "refund.processed",
                  description: "A refund has been successfully processed and sent to the customer"
                },
                {
                  event: "refund.failed",
                  description: "A refund attempt failed"
                },
                {
                  event: "dispute.created",
                  description: "A customer has initiated a dispute (rare with crypto, but possible)"
                },
                {
                  event: "payout.succeeded",
                  description: "Your merchant payout has been sent to your wallet"
                },
                {
                  event: "payout.failed",
                  description: "A payout to your wallet failed"
                }
              ].map((item, i) => (
                <div key={i} className="border border-purple-500/30 rounded-lg p-4 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-5 w-5 text-purple-400" />
                    <code className="text-purple-300 font-mono text-sm">{item.event}</code>
                  </div>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Webhook Payload */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Webhook Payload Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-4 relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-purple-400 hover:text-purple-300"
                onClick={() => copyToClipboard(JSON.stringify({
                  type: "payment.succeeded",
                  id: "evt_abc123xyz",
                  created: 1698765432,
                  data: {
                    id: "pay_xyz789abc",
                    amount: 99.99,
                    currency: "USD",
                    merchant_id: "mch_merchant123",
                    customer_email: "customer@example.com",
                    status: "completed",
                    tx_hash: "0x1234...5678",
                    blockchain: "ethereum",
                    metadata: {
                      order_id: "ORD-12345",
                      customer_name: "John Doe"
                    },
                    created_at: "2025-10-31T12:00:00Z"
                  }
                }, null, 2), 'payload')}
                data-testid="button-copy-payload"
              >
                {copiedCode === 'payload' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`{
  "type": "payment.succeeded",
  "id": "evt_abc123xyz",
  "created": 1698765432,
  "data": {
    "id": "pay_xyz789abc",
    "amount": 99.99,
    "currency": "USD",
    "merchant_id": "mch_merchant123",
    "customer_email": "customer@example.com",
    "status": "completed",
    "tx_hash": "0x1234...5678",
    "blockchain": "ethereum",
    "metadata": {
      "order_id": "ORD-12345",
      "customer_name": "John Doe"
    },
    "created_at": "2025-10-31T12:00:00Z"
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Code Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Node.js */}
            <div>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-400" />
                Node.js + Express
              </h3>
              <div className="bg-slate-900 rounded-lg p-4 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-purple-400 hover:text-purple-300 z-10"
                  onClick={() => copyToClipboard(codeExamples.nodejs, 'nodejs')}
                  data-testid="button-copy-nodejs"
                >
                  {copiedCode === 'nodejs' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {codeExamples.nodejs}
                </pre>
              </div>
            </div>

            {/* Python */}
            <div>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-400" />
                Python + Flask
              </h3>
              <div className="bg-slate-900 rounded-lg p-4 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-purple-400 hover:text-purple-300 z-10"
                  onClick={() => copyToClipboard(codeExamples.python, 'python')}
                  data-testid="button-copy-python"
                >
                  {copiedCode === 'python' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {codeExamples.python}
                </pre>
              </div>
            </div>

            {/* PHP */}
            <div>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-400" />
                PHP
              </h3>
              <div className="bg-slate-900 rounded-lg p-4 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-purple-400 hover:text-purple-300 z-10"
                  onClick={() => copyToClipboard(codeExamples.php, 'php')}
                  data-testid="button-copy-php"
                >
                  {copiedCode === 'php' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {codeExamples.php}
                </pre>
              </div>
            </div>

            {/* cURL Testing */}
            <div>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-400" />
                Testing with cURL
              </h3>
              <div className="bg-slate-900 rounded-lg p-4 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-purple-400 hover:text-purple-300 z-10"
                  onClick={() => copyToClipboard(codeExamples.curl, 'curl')}
                  data-testid="button-copy-curl"
                >
                  {copiedCode === 'curl' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {codeExamples.curl}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-300 mb-2">⚠️ ALWAYS verify webhook signatures</h4>
              <p className="text-sm text-yellow-200">
                Never trust webhook data without verifying the signature. An attacker could send fake webhooks to your endpoint.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-400 text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Use HTTPS endpoints only</h4>
                  <p className="text-sm text-gray-400">HTTP webhooks will be rejected for security reasons</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-400 text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Verify signatures using timing-safe comparison</h4>
                  <p className="text-sm text-gray-400">Prevents timing attacks (use crypto.timingSafeEqual in Node.js)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-400 text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Respond quickly (within 5 seconds)</h4>
                  <p className="text-sm text-gray-400">Process webhooks asynchronously to avoid timeouts</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-400 text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Handle duplicate events</h4>
                  <p className="text-sm text-gray-400">Webhooks may be sent multiple times. Use event IDs to deduplicate</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-400 text-sm font-bold">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Keep secrets secure</h4>
                  <p className="text-sm text-gray-400">Store webhook secrets in environment variables, never in code</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Started */}
        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Integrate?</h2>
            <p className="text-xl text-gray-300 mb-6">
              Sign up for CODEX Pay and get your webhook secret key
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setLocation("/auth")}
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg"
                data-testid="button-get-started-webhooks"
              >
                Get Started
              </Button>
              <Button 
                onClick={() => setLocation("/contact")}
                size="lg" 
                variant="outline"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 px-8 py-4 text-lg"
                data-testid="button-contact-support"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
