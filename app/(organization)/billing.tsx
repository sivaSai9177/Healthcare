import React, { useState } from 'react';
import { ScrollView, View, Platform } from 'react-native';
import { useSpacing } from '@/hooks/core/useSpacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBreakpoint } from '@/hooks/responsive/useBreakpoint';
import {
  Card,
  Text,
  Button,
  Badge,
  Stack,
  Grid,
  Progress,
  Dialog,
  RadioGroup,
  Separator,
  Alert,
  Switch,
} from '@/components/universal';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme/provider';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billing: 'monthly',
    features: [
      'Up to 5 team members',
      'Basic analytics',
      '10 alerts per month',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 49,
    billing: 'monthly',
    popular: true,
    features: [
      'Up to 25 team members',
      'Advanced analytics',
      'Unlimited alerts',
      'Priority support',
      'API access',
      'Custom integrations',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    billing: 'monthly',
    features: [
      'Unlimited team members',
      'Enterprise analytics',
      'Unlimited everything',
      'Dedicated support',
      'Custom SLA',
      'On-premise deployment',
      'Advanced security',
    ],
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    date: '2025-01-01',
    amount: 49.00,
    status: 'paid',
    description: 'Professional Plan - January 2025',
  },
  {
    id: 'INV-002',
    date: '2024-12-01',
    amount: 49.00,
    status: 'paid',
    description: 'Professional Plan - December 2024',
  },
  {
    id: 'INV-003',
    date: '2024-11-01',
    amount: 49.00,
    status: 'paid',
    description: 'Professional Plan - November 2024',
  },
];

export default function BillingScreen() {
  const theme = useTheme();
  const spacing = useSpacing();
  const breakpoint = useBreakpoint();
  const [currentPlan] = useState('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'muted');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const dangerColor = useThemeColor({}, 'destructive');

  const currentPlanDetails = plans.find((p) => p.id === currentPlan);
  const yearlyDiscount = 0.2; // 20% discount for yearly

  const getPrice = (plan: Plan) => {
    const basePrice = plan.price;
    return billingCycle === 'yearly' ? basePrice * 12 * (1 - yearlyDiscount) : basePrice;
  };

  const handleUpgrade = () => {
// TODO: Replace with structured logging - console.log('Upgrading to:', selectedPlan);
    setIsUpgradeDialogOpen(false);
  };

  const handleCancelSubscription = () => {
// TODO: Replace with structured logging - console.log('Cancelling subscription');
    setShowCancelDialog(false);
  };

  const downloadInvoice = (invoiceId: string) => {
// TODO: Replace with structured logging - console.log('Downloading invoice:', invoiceId);
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xl * 2,
        }}
      >
        {/* Header */}
        <Stack space="lg" style={{ marginBottom: spacing.xl }}>
          <Stack space="sm">
            <Text variant="heading" size="2xl">
              Billing & Subscription
            </Text>
            <Text variant="muted">
              Manage your subscription and billing information
            </Text>
          </Stack>
        </Stack>

        {/* Current Plan */}
        <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
          <Stack space="md">
            <Stack direction="horizontal" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack space="xs">
                <Stack direction="horizontal" space="sm" style={{ alignItems: 'center' }}>
                  <Text variant="heading" size="xl">
                    {currentPlanDetails?.name} Plan
                  </Text>
                  <Badge variant="primary">Active</Badge>
                </Stack>
                <Text variant="muted">
                  ${currentPlanDetails?.price}/month • Next billing date: Feb 1, 2025
                </Text>
              </Stack>
              <Button
                variant="outline"
                onPress={() => setIsUpgradeDialogOpen(true)}
              >
                Change Plan
              </Button>
            </Stack>

            <Separator />

            <Grid columns={isDesktop ? 3 : 1} gap={spacing.md}>
              <Stack space="xs">
                <Text variant="muted" size="sm">
                  Monthly Usage
                </Text>
                <Stack space="xs">
                  <Text>18 / 25 team members</Text>
                  <Progress value={72} max={100} />
                </Stack>
              </Stack>
              <Stack space="xs">
                <Text variant="muted" size="sm">
                  Alerts This Month
                </Text>
                <Stack space="xs">
                  <Text>234 / Unlimited</Text>
                  <Progress value={100} max={100} />
                </Stack>
              </Stack>
              <Stack space="xs">
                <Text variant="muted" size="sm">
                  Storage Used
                </Text>
                <Stack space="xs">
                  <Text>4.2 GB / 10 GB</Text>
                  <Progress value={42} max={100} />
                </Stack>
              </Stack>
            </Grid>

            <Stack direction="horizontal" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="horizontal" space="sm" style={{ alignItems: 'center' }}>
                <Text>Auto-renewal</Text>
                <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
              </Stack>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowCancelDialog(true)}
              >
                Cancel Subscription
              </Button>
            </Stack>
          </Stack>
        </Card>

        {/* Billing Cycle Toggle */}
        <Card style={{ padding: spacing.md, marginBottom: spacing.xl }}>
          <Stack direction="horizontal" style={{ justifyContent: 'center', alignItems: 'center' }} space="md">
            <Text>Monthly</Text>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <Stack direction="horizontal" space="xs" style={{ alignItems: 'center' }}>
              <Text>Yearly</Text>
              <Badge variant="success" size="sm">
                Save 20%
              </Badge>
            </Stack>
          </Stack>
        </Card>

        {/* Available Plans */}
        <Stack space="md" style={{ marginBottom: spacing.xl }}>
          <Text variant="heading" size="lg">
            Available Plans
          </Text>
          <Grid columns={isDesktop ? 3 : 1} gap={spacing.md}>
            {plans.map((plan) => (
              <Card
                key={plan.id}
                style={{
                  padding: spacing.lg,
                  borderWidth: plan.id === currentPlan ? 2 : 1,
                  borderColor: plan.id === currentPlan ? successColor : undefined,
                }}
              >
                <Stack space="md">
                  {plan.popular && (
                    <Badge variant="primary" size="sm" style={{ alignSelf: 'flex-start' }}>
                      Most Popular
                    </Badge>
                  )}
                  <Stack space="xs">
                    <Text variant="heading" size="lg">
                      {plan.name}
                    </Text>
                    <Stack direction="horizontal" style={{ alignItems: 'baseline' }} space="xs">
                      <Text variant="heading" size="2xl">
                        ${getPrice(plan)}
                      </Text>
                      <Text variant="muted">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </Text>
                    </Stack>
                  </Stack>

                  <Stack space="sm">
                    {plan.features.map((feature, index) => (
                      <Stack key={index} direction="horizontal" space="sm" style={{ alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle" size={16} color={successColor} />
                        <Text size="sm">{feature}</Text>
                      </Stack>
                    ))}
                  </Stack>

                  {plan.id === currentPlan ? (
                    <Button variant="secondary" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
                      onPress={() => {
                        setSelectedPlan(plan.id);
                        setIsUpgradeDialogOpen(true);
                      }}
                    >
                      {plan.price > (currentPlanDetails?.price || 0) ? 'Upgrade' : 'Downgrade'}
                    </Button>
                  )}
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>

        {/* Payment Method */}
        <Card style={{ padding: spacing.lg, marginBottom: spacing.xl }}>
          <Stack space="md">
            <Stack direction="horizontal" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="heading" size="lg">
                Payment Method
              </Text>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </Stack>
            <Stack direction="horizontal" space="md" style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 32,
                  borderRadius: 4,
                  backgroundColor: '#1a1a1a',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>VISA</Text>
              </View>
              <Stack space="xs">
                <Text>•••• •••• •••• 4242</Text>
                <Text variant="muted" size="sm">
                  Expires 12/2025
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* Billing History */}
        <Stack space="md">
          <Text variant="heading" size="lg">
            Billing History
          </Text>
          {mockInvoices.map((invoice) => (
            <Card key={invoice.id} style={{ padding: spacing.md }}>
              <Stack
                direction={isDesktop ? 'horizontal' : 'vertical'}
                space="md"
                style={{
                  alignItems: isDesktop ? 'center' : 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <Stack space="xs" style={{ flex: 1 }}>
                  <Stack direction="horizontal" space="sm" style={{ alignItems: 'center' }}>
                    <Text>{invoice.description}</Text>
                    <Badge
                      variant={
                        invoice.status === 'paid'
                          ? 'success'
                          : invoice.status === 'pending'
                          ? 'warning'
                          : 'destructive'
                      }
                      size="sm"
                    >
                      {invoice.status}
                    </Badge>
                  </Stack>
                  <Text variant="muted" size="sm">
                    {new Date(invoice.date).toLocaleDateString()} • {invoice.id}
                  </Text>
                </Stack>
                <Stack direction="horizontal" space="sm" style={{ alignItems: 'center' }}>
                  <Text variant="heading" size="md">
                    ${invoice.amount.toFixed(2)}
                  </Text>
                  <Button
                    variant="ghost"
                    size="icon"
                    onPress={() => downloadInvoice(invoice.id)}
                  >
                    <Ionicons name="download-outline" size={20} />
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>

        {/* Upgrade Dialog */}
        <Dialog
          open={isUpgradeDialogOpen}
          onOpenChange={setIsUpgradeDialogOpen}
          title="Change Subscription Plan"
          description="Your new plan will take effect immediately"
        >
          <Stack space="md" style={{ padding: spacing.lg }}>
            <Alert variant="info">
              <Text size="sm">
                You will be charged the prorated difference for the current billing period.
              </Text>
            </Alert>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              {plans.map((plan) => (
                <RadioGroup.Item
                  key={plan.id}
                  value={plan.id}
                  label={`${plan.name} - $${getPrice(plan)}/${billingCycle}`}
                />
              ))}
            </RadioGroup>
            <Stack direction="horizontal" space="sm" style={{ marginTop: spacing.md }}>
              <Button
                variant="outline"
                onPress={() => setIsUpgradeDialogOpen(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onPress={handleUpgrade}
                style={{ flex: 1 }}
                disabled={!selectedPlan || selectedPlan === currentPlan}
              >
                Confirm Change
              </Button>
            </Stack>
          </Stack>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          title="Cancel Subscription"
          description="Are you sure you want to cancel your subscription?"
        >
          <Stack space="md" style={{ padding: spacing.lg }}>
            <Alert variant="warning">
              <Text size="sm">
                Your subscription will remain active until Feb 1, 2025. After that, you&apos;ll be
                downgraded to the Free plan.
              </Text>
            </Alert>
            <Stack direction="horizontal" space="sm">
              <Button
                variant="outline"
                onPress={() => setShowCancelDialog(false)}
                style={{ flex: 1 }}
              >
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onPress={handleCancelSubscription}
                style={{ flex: 1 }}
              >
                Cancel Subscription
              </Button>
            </Stack>
          </Stack>
        </Dialog>
      </ScrollView>
    </View>
  );
}