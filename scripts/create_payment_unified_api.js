const fs = require('fs');
const path = require('path');

const WEB_ROOT = 'c:\\Users\\PC\\Desktop\\astroparihar';

function writeFile(subPath, content) {
  const fullPath = path.join(WEB_ROOT, subPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created: ${subPath}`);
}

const PAYMENT_API_ROUTE = `import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSettings } from '@/lib/settings';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// In-memory / storage fallback for active mobile sessions
let mobileWalletBalance = 450;
let mobileTransactions: any[] = [
  { id: 'tx_1', type: 'credit', title: 'Welcome Bonus', subtitle: 'New User Promo', amount: 50, date: 'Today, 09:00 AM', status: 'success' },
  { id: 'tx_2', type: 'credit', title: 'Wallet Recharge', subtitle: 'UPI • GPay', amount: 500, date: 'Yesterday, 03:15 PM', status: 'success' },
  { id: 'tx_3', type: 'debit', title: 'Consultation with Pandit Radhey', subtitle: 'Voice Call • 10 min', amount: -100, date: 'Yesterday, 04:30 PM', status: 'success' },
];

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || 'mobile_user';

    const settings = await getSettings();
    const razorpayKeyId = (
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      settings?.razorpayKeyId ||
      'rzp_test_placeholder'
    ).trim();

    return NextResponse.json({
      success: true,
      balance: mobileWalletBalance,
      currency: 'INR',
      currencySymbol: '₹',
      razorpayKeyId,
      transactions: mobileTransactions,
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch wallet info',
    }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, amount, paymentMethod = 'UPI', transactionType = 'recharge', description, astrologerName } = body;

    if (action === 'create_order') {
      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400, headers: corsHeaders });
      }

      const orderId = \`order_m_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`;
      return NextResponse.json({
        success: true,
        orderId,
        amount: numAmount * 100, // paise
        currency: 'INR',
        receipt: \`rcpt_\${Date.now()}\`,
      }, { headers: corsHeaders });
    }

    if (action === 'recharge' || action === 'verify_payment') {
      const rechargeAmount = Number(amount) || 0;
      if (rechargeAmount <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid recharge amount' }, { status: 400, headers: corsHeaders });
      }

      mobileWalletBalance += rechargeAmount;

      const txId = \`tx_\${Date.now()}\`;
      const newTx = {
        id: txId,
        type: 'credit',
        title: 'Wallet Recharge',
        subtitle: \`\${paymentMethod} Payment\`,
        amount: rechargeAmount,
        date: 'Just now',
        status: 'success',
        createdAt: new Date().toISOString(),
      };
      mobileTransactions.unshift(newTx);

      return NextResponse.json({
        success: true,
        message: 'Wallet recharged successfully',
        newBalance: mobileWalletBalance,
        transaction: newTx,
      }, { headers: corsHeaders });
    }

    if (action === 'deduct') {
      const deductAmount = Number(amount) || 0;
      if (deductAmount <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid deduction amount' }, { status: 400, headers: corsHeaders });
      }

      if (mobileWalletBalance < deductAmount) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient wallet balance',
          availableBalance: mobileWalletBalance,
          requiredAmount: deductAmount,
        }, { status: 402, headers: corsHeaders });
      }

      mobileWalletBalance = Math.max(0, mobileWalletBalance - deductAmount);

      const txId = \`tx_\${Date.now()}\`;
      const newTx = {
        id: txId,
        type: 'debit',
        title: description || (astrologerName ? \`Consultation with \${astrologerName}\` : 'Astrology Service'),
        subtitle: 'Consultation Usage',
        amount: -deductAmount,
        date: 'Just now',
        status: 'success',
        createdAt: new Date().toISOString(),
      };
      mobileTransactions.unshift(newTx);

      return NextResponse.json({
        success: true,
        message: 'Balance deducted successfully',
        newBalance: mobileWalletBalance,
        transaction: newTx,
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400, headers: corsHeaders });
  } catch (error: any) {
    console.error('Wallet API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Payment service error',
    }, { status: 500, headers: corsHeaders });
  }
}
`;

writeFile('src/app/api/app-dynamic/wallet/route.ts', PAYMENT_API_ROUTE);
console.log('Unified Payment & Wallet API created successfully!');
