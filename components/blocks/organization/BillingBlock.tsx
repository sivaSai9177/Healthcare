import React, { useState } from 'react';
import { View } from 'react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { Stack, Grid } from '@/components/universal/layout';
import { Dialog } from '@/components/universal/overlay';
import { Alert } from '@/components/universal/feedback';
import { cn } from '@/lib/core/utils';
import { useResponsive } from '@/hooks/responsive';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { 
  CreditCard, 
  CheckIcon, 
  AlertCircle,
  Download,
} from '@/components/universal/display/Symbols';
import { format } from 'date-fns';

interface BillingBlockProps {
  organizationId: string;
  currentPlan?: 'free' | 'pro' | 'enterprise';
  onUpgrade?: (plan: string) => void;
  onCancel?: () => void;
  onUpdatePayment?: () => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for small teams',
    features: [
      'Up to 5 team members',
      'Basic alert management',
      '7-day data retention',
      'Community support',
    ],
    limits: {
      members: 5,
      alerts: 100,
      retention: 7,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    description: 'For growing organizations',
    features: [
      'Up to 50 team members',
      'Advanced alert workflows',
      '30-day data retention',
      'Priority support',
      'API access',
      'Custom integrations',
    ],
    limits: {
      members: 50,
      alerts: 'Unlimited',
      retention: 30,
    },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    interval: 'month',
    description: 'For large organizations',
    features: [
      'Unlimited team members',
      'Custom workflows',
      'Unlimited data retention',
      'Dedicated support',
      'SLA guarantee',
      'On-premise deployment',
      'Advanced security',
      'Custom training',
    ],
    limits: {
      members: 'Unlimited',
      alerts: 'Unlimited',
      retention: 'Unlimited',
    },
  },
];

const mockInvoices = [
  {
    id: 'inv-001',
    date: new Date('2024-12-01'),
    amount: 29,
    status: 'paid',
    description: 'Pro Plan - Monthly',
  },
  {
    id: 'inv-002',
    date: new Date('2024-11-01'),
    amount: 29,
    status: 'paid',
    description: 'Pro Plan - Monthly',
  },
  {
    id: 'inv-003',
    date: new Date('2024-10-01'),
    amount: 29,
    status: 'paid',
    description: 'Pro Plan - Monthly',
  },
];

export function BillingBlock({
  currentPlan = 'pro',
  onUpgrade,
  onCancel,
  onUpdatePayment,
}: BillingBlockProps) {
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const handlePlanSelect = (planId: string) => {
    if (planId === currentPlan) return;
    
    if (planId === 'enterprise') {
      // Handle enterprise contact
      haptic('light');
      window.open('mailto:sales@example.com?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }
    
    setSelectedPlan(planId);
    setShowUpgradeDialog(true);
    haptic('light');
  };
  
  const confirmUpgrade = () => {
    if (selectedPlan) {
      haptic('success');
      onUpgrade?.(selectedPlan);
      setShowUpgradeDialog(false);
      setSelectedPlan(null);
    }
  };
  
  const confirmCancel = () => {
    haptic('warning');
    onCancel?.();
    setShowCancelDialog(false);
  };
  
  const currentPlanData = plans.find(p => p.id === currentPlan);
  const yearlyDiscount = 0.2; // 20% discount
  
  return (
    <View className="animate-fade-in">
      {/* Current Plan */}
      <Card shadow="md" className="mb-6">
        <CardHeader>
          <Stack direction="horizontal" justify="between" align="center">
            <View>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your organization is on the {currentPlanData?.name} plan
              </CardDescription>
            </View>
            <Badge variant="secondary" size="lg">
              {currentPlanData?.name}
            </Badge>
          </Stack>
        </CardHeader>
        <CardContent>
          <Grid columns={isMobile ? 1 : 3} gap={spacing[4] as any}>
            <View>
              <Text colorTheme="mutedForeground" size="sm">Monthly Cost</Text>
              <Text size="2xl" weight="bold">
                ${typeof currentPlanData?.price === 'number' ? currentPlanData.price : 'Custom'}
              </Text>
            </View>
            <View>
              <Text colorTheme="mutedForeground" size="sm">Next Billing Date</Text>
              <Text size="lg" weight="medium">
                {format(new Date('2025-01-01'), 'MMM d, yyyy')}
              </Text>
            </View>
            <View>
              <Text colorTheme="mutedForeground" size="sm">Payment Method</Text>
              <Stack direction="horizontal" gap={spacing[1] as any} align="center">
                <CreditCard size={16} />
                <Text size="lg" weight="medium">•••• 4242</Text>
              </Stack>
            </View>
          </Grid>
        </CardContent>
        {currentPlan !== 'enterprise' && (
          <CardFooter>
            <Stack direction="horizontal" gap={spacing[2] as any}>
              <Button
                variant="outline"
                size="sm"
                onPress={onUpdatePayment}
                leftIcon={<CreditCard size={16} />}
              >
                Update Payment
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onPress={() => setShowCancelDialog(true)}
              >
                Cancel Plan
              </Button>
            </Stack>
          </CardFooter>
        )}
      </Card>
      
      {/* Available Plans */}
      <View style={{ marginBottom: spacing[6] }}>
        <Stack gap={spacing[4] as any}>
          <Stack direction="horizontal" justify="between" align="center">
            <View>
              <Text size="xl" weight="bold">Available Plans</Text>
              <Text colorTheme="mutedForeground" size="sm">
                Choose the plan that best fits your organization
              </Text>
            </View>
            <View 
              className="flex-row items-center gap-2 p-1 bg-muted rounded-lg"
            >
              <Button
                variant={billingInterval === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onPress={() => setBillingInterval('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={billingInterval === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onPress={() => setBillingInterval('yearly')}
              >
                Yearly
                <Badge variant="success" size="xs">
                  Save 20%
                </Badge>
              </Button>
            </View>
          </Stack>
          
          <Grid columns={isMobile ? 1 : 3} gap={spacing[4] as any}>
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const price = typeof plan.price === 'number' 
                ? billingInterval === 'yearly' 
                  ? Math.round(plan.price * 12 * (1 - yearlyDiscount))
                  : plan.price
                : plan.price;
              
              return (
                <Card
                  key={plan.id}
                  shadow="md"
                  variant={isCurrentPlan ? 'elevated' : 'outline'}
                  pressable={!isCurrentPlan}
                  onPress={() => handlePlanSelect(plan.id)}
                  className={cn(
                    "relative transition-all duration-200",
                    plan.popular && "border-primary",
                    isCurrentPlan && "bg-primary/5 border-primary",
                    "animate-scale-in"
                  )}
                >
                  {plan.popular && !isCurrentPlan && (
                    <View className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="default" size="sm">
                        Most Popular
                      </Badge>
                    </View>
                  )}
                  
                  <CardHeader>
                    <Stack gap={spacing[2] as any}>
                      <View className="flex-row items-center justify-between">
                        <Text size="lg" weight="bold">{plan.name}</Text>
                        {isCurrentPlan && (
                          <Badge variant="secondary" size="sm">
                            Current
                          </Badge>
                        )}
                      </View>
                      <Text colorTheme="mutedForeground" size="sm">
                        {plan.description}
                      </Text>
                    </Stack>
                  </CardHeader>
                  
                  <CardContent>
                    <View style={{ marginBottom: spacing[4] }}>
                      {typeof price === 'number' ? (
                        <Stack direction="horizontal" align="baseline" gap={spacing[1] as any}>
                          <Text size="3xl" weight="bold">${price}</Text>
                          <Text colorTheme="mutedForeground" size="sm">
                            /{billingInterval === 'yearly' ? 'year' : 'month'}
                          </Text>
                        </Stack>
                      ) : (
                        <Text size="3xl" weight="bold">{price}</Text>
                      )}
                    </View>
                    
                    <Stack gap={spacing[2] as any}>
                      {plan.features.map((feature, index) => (
                        <Stack 
                          key={index} 
                          direction="horizontal" 
                          gap={spacing[2] as any}
                          align="center"
                        >
                          <CheckIcon size={16} className="text-success flex-shrink-0" />
                          <Text size="sm">{feature}</Text>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                  
                  <CardFooter>
                    <Button
                      variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'outline'}
                      size="sm"
                      onPress={() => handlePlanSelect(plan.id)}
                      disabled={isCurrentPlan}
                      className="w-full"
                    >
                      {isCurrentPlan ? 'Current Plan' : 
                       plan.id === 'enterprise' ? 'Contact Sales' : 
                       'Upgrade'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </Grid>
        </Stack>
      </View>
      
      {/* Billing History */}
      <Card shadow="md">
        <CardHeader>
          <Stack direction="horizontal" justify="between" align="center">
            <CardTitle>Billing History</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Download size={16} />}
            >
              Download All
            </Button>
          </Stack>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Date</TableCell>
                <TableCell header>Description</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Invoice</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    {format(invoice.date, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>${invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant="success" size="sm">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Download size={14} />}
                    >
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              You&apos;re upgrading to the {plans.find(p => p.id === selectedPlan)?.name} plan.
              Your new features will be available immediately.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="info">
            <AlertCircle size={16} />
            <AlertTitle>Billing Information</AlertTitle>
            <AlertDescription>
              You&apos;ll be charged the prorated amount for the remainder of this billing cycle.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onPress={() => setShowUpgradeDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onPress={confirmUpgrade}
            >
              Confirm Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Your Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You&apos;ll lose access to premium features at the end of your billing cycle.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="warning">
            <AlertCircle size={16} />
            <AlertTitle>What happens next?</AlertTitle>
            <AlertDescription>
              • Your plan will remain active until {format(new Date('2025-01-01'), 'MMM d, yyyy')}
              • You&apos;ll be downgraded to the Free plan after that
              • Your data will be retained for 30 days
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onPress={() => setShowCancelDialog(false)}
            >
              Keep Plan
            </Button>
            <Button
              variant="destructive"
              onPress={confirmCancel}
            >
              Cancel Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}

export type { BillingBlockProps };