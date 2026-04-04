import { SubscriptionPlan_Model, DEFAULT_PLANS } from '../modules/subscription/subscription.plans';

/**
 * Seed subscription plans into the database
 * Run this once to populate default subscription plans
 * 
 * Usage: npx ts-node src/app/utils/seed_subscription_plans.ts
 */
const seedSubscriptionPlans = async () => {
  try {
    console.log('🌱 Starting to seed subscription plans...');

    // Check if plans already exist
    const existingPlans = await SubscriptionPlan_Model.countDocuments();
    
    if (existingPlans > 0) {
      console.log('✅ Subscription plans already exist. Skipping seed.');
      return;
    }

    // Insert default plans
    await SubscriptionPlan_Model.insertMany(DEFAULT_PLANS);
    
    console.log('✅ Successfully seeded subscription plans:');
    DEFAULT_PLANS.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.planId}) - $${plan.price / 100}`);
    });

    console.log('\n💡 Next steps:');
    console.log('   1. Update the stripePriceId fields with actual Stripe Price IDs');
    console.log('   2. Create corresponding products in your Stripe Dashboard');
    console.log('   3. Update webhook endpoint in Stripe: https://your-domain.com/webhooks/stripe');

  } catch (error) {
    console.error('❌ Failed to seed subscription plans:', error);
    throw error;
  }
};

export default seedSubscriptionPlans;
