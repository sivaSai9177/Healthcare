# Phase 2: Alert System Development Plan

## 🎯 Overview
With Phase 1 (Authentication System) completed with 100% test coverage, we now move to Phase 2: implementing the core alert system for the Hospital Alert App.

## 📊 Current Status
- ✅ **Authentication**: 100% complete with comprehensive testing
- ✅ **Database Schema**: Basic setup complete
- ✅ **tRPC Infrastructure**: Foundation ready
- 🎯 **Next**: Alert creation and management system

## 🚀 Phase 2 Immediate Tasks (Next 2 weeks)

### **Week 1: Alert Creation Foundation**

#### **Day 1-2: Alert System Database**
- [ ] **Task B.1**: Extend database schema for alerts
  - Add alerts table with all required fields
  - Add alert_acknowledgments table
  - Add alert_escalations table
  - Create proper indexes and relationships
  - **Priority**: HIGH
  - **Time Estimate**: 4 hours

#### **Day 3-4: Alert Creation API**
- [ ] **Task B.2**: Implement tRPC procedures for alerts
  - Create alert creation endpoint
  - Add alert listing endpoints (by role)
  - Add alert acknowledgment endpoint
  - Add input validation with Zod schemas
  - **Priority**: HIGH
  - **Time Estimate**: 6 hours

#### **Day 5-7: Operator Dashboard**
- [ ] **Task B.3**: Create operator alert creation interface
  - Design alert creation form UI
  - Add room number input with validation
  - Add alert type selection (Cardiac Arrest, Code Blue, etc.)
  - Add urgency level selector
  - Implement form submission with feedback
  - **Priority**: HIGH
  - **Time Estimate**: 8 hours

### **Week 2: Alert Display & Basic Notifications**

#### **Day 8-10: Alert Display System**
- [ ] **Task B.4**: Medical staff alert dashboard
  - Create alert list component for doctors/nurses
  - Add real-time alert updates
  - Implement acknowledgment buttons
  - Add alert status indicators
  - **Priority**: HIGH
  - **Time Estimate**: 6 hours

#### **Day 11-12: Push Notification Setup**
- [ ] **Task C.1**: Basic notification infrastructure
  - Configure Expo Push Notifications
  - Set up device token registration
  - Create basic notification sending service
  - Test notifications on development devices
  - **Priority**: HIGH
  - **Time Estimate**: 6 hours

#### **Day 13-14: Integration & Testing**
- [ ] **Task B.5**: End-to-end alert flow testing
  - Test complete alert creation to acknowledgment flow
  - Add comprehensive test suite for alert system
  - Performance testing with multiple alerts
  - **Priority**: MEDIUM
  - **Time Estimate**: 4 hours

## 🛠️ Technical Implementation Details

### **1. Database Schema Extensions**
```sql
-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  alert_code VARCHAR(20) NOT NULL, -- RED, BLUE, YELLOW
  urgency_level INTEGER NOT NULL DEFAULT 1, -- 1-5 scale
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalation_level INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'ACTIVE' -- ACTIVE, ACKNOWLEDGED, RESOLVED
);

-- Alert acknowledgments for tracking all responses
CREATE TABLE alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_time_seconds INTEGER
);

-- Alert escalations tracking
CREATE TABLE alert_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL,
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason VARCHAR(100) DEFAULT 'TIMEOUT'
);

-- Indexes for performance
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_room ON alerts(room_number);
CREATE INDEX idx_alert_acks_alert_id ON alert_acknowledgments(alert_id);
```

### **2. tRPC Procedures**
```typescript
// src/server/routers/alerts.ts
export const alertsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      roomNumber: z.string().min(1).max(20),
      alertType: z.enum(['CARDIAC_ARREST', 'CODE_BLUE', 'FIRE', 'SECURITY']),
      alertCode: z.enum(['RED', 'BLUE', 'YELLOW', 'GREEN']),
      urgencyLevel: z.number().min(1).max(5),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only operators can create alerts
      if (ctx.user.role !== 'operator') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const alert = await ctx.db.insert(alerts).values({
        ...input,
        createdBy: ctx.user.id,
      }).returning();
      
      // Trigger notifications to medical staff
      await triggerAlertNotifications(alert[0]);
      
      return alert[0];
    }),

  list: protectedProcedure
    .input(z.object({
      status: z.enum(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      // Medical staff can see alerts, operators see their own
      const where = ctx.user.role === 'operator' 
        ? eq(alerts.createdBy, ctx.user.id)
        : undefined;
        
      return ctx.db.select()
        .from(alerts)
        .where(and(where, input.status ? eq(alerts.status, input.status) : undefined))
        .orderBy(desc(alerts.createdAt))
        .limit(input.limit);
    }),

  acknowledge: protectedProcedure
    .input(z.object({
      alertId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only medical staff can acknowledge
      if (ctx.user.role === 'operator') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const alert = await ctx.db.update(alerts)
        .set({
          acknowledgedBy: ctx.user.id,
          acknowledgedAt: new Date(),
          status: 'ACKNOWLEDGED',
        })
        .where(eq(alerts.id, input.alertId))
        .returning();
        
      // Record acknowledgment
      await ctx.db.insert(alertAcknowledgments).values({
        alertId: input.alertId,
        userId: ctx.user.id,
      });
      
      return alert[0];
    }),
});
```

### **3. React Components**

#### **Alert Creation Form (Operator)**
```typescript
// app/(home)/operator-dashboard.tsx
export default function OperatorDashboard() {
  const { user } = useAuth();
  const { mutate: createAlert, isPending } = api.alerts.create.useMutation();
  
  const form = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
  });
  
  const onSubmit = (data: AlertFormData) => {
    createAlert(data, {
      onSuccess: () => {
        toast.success('Alert created successfully');
        form.reset();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };
  
  return (
    <ScrollView className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Emergency Alert</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <Input placeholder="e.g., ICU-301" {...field} />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="alertType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Type</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CARDIAC_ARREST">Cardiac Arrest</SelectItem>
                      <SelectItem value="CODE_BLUE">Code Blue</SelectItem>
                      <SelectItem value="FIRE">Fire Emergency</SelectItem>
                      <SelectItem value="SECURITY">Security Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Creating Alert...' : 'Create Alert'}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
```

#### **Alert List (Medical Staff)**
```typescript
// app/(home)/alerts.tsx
export default function AlertsScreen() {
  const { data: alerts, refetch } = api.alerts.list.useQuery({
    status: 'ACTIVE',
  });
  
  const { mutate: acknowledgeAlert } = api.alerts.acknowledge.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Alert acknowledged');
    },
  });
  
  return (
    <ScrollView className="p-4">
      <Text className="text-2xl font-bold mb-4">Active Alerts</Text>
      
      {alerts?.map((alert) => (
        <Card key={alert.id} className="mb-4">
          <CardContent className="p-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-semibold">
                  {alert.alertType.replace('_', ' ')}
                </Text>
                <Text className="text-gray-600">Room: {alert.roomNumber}</Text>
                <Text className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(alert.createdAt))} ago
                </Text>
              </View>
              
              <View className="items-end">
                <Badge variant={getAlertCodeVariant(alert.alertCode)}>
                  {alert.alertCode}
                </Badge>
                
                {!alert.acknowledgedBy && (
                  <Button
                    size="sm"
                    onPress={() => acknowledgeAlert({ alertId: alert.id })}
                    className="mt-2"
                  >
                    Acknowledge
                  </Button>
                )}
              </View>
            </View>
          </CardContent>
        </Card>
      ))}
    </ScrollView>
  );
}
```

### **4. Push Notifications**
```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';

export const registerForPushNotifications = async (): Promise<string | null> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return null;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
};

export const sendAlertNotification = async (
  pushTokens: string[],
  alert: Alert
) => {
  const message = {
    to: pushTokens,
    sound: 'default',
    title: `🚨 ${alert.alertType.replace('_', ' ')}`,
    body: `Room ${alert.roomNumber} - Immediate attention required`,
    data: { alertId: alert.id, type: 'ALERT' },
    priority: 'high',
  };
  
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
};
```

## 🧪 Testing Strategy for Phase 2

### **1. Alert Creation Tests**
- Form validation and submission
- Role-based access control
- Database integration
- Error handling

### **2. Alert Display Tests**
- Real-time updates
- Role-based filtering
- Acknowledgment flow
- UI responsiveness

### **3. Notification Tests**
- Permission handling
- Message delivery
- Sound and vibration
- Background handling

### **4. Integration Tests**
- Complete alert lifecycle
- Multi-user scenarios
- Performance under load
- Error recovery

## 📈 Success Metrics for Phase 2

- **Alert Creation**: < 5 seconds from input to notification
- **Alert Acknowledgment**: < 2 seconds response time
- **Notification Delivery**: > 95% delivery rate within 5 seconds
- **System Load**: Handle 100+ concurrent alerts
- **User Experience**: < 3 taps to create or acknowledge alert

## 🔄 Risk Mitigation

### **High Risks**
1. **Push Notification Reliability**: iOS/Android platform differences
   - **Mitigation**: Comprehensive testing on real devices
   
2. **Real-time Performance**: Database queries under load
   - **Mitigation**: Database indexing and connection pooling
   
3. **Network Connectivity**: Hospital WiFi reliability
   - **Mitigation**: Offline caching and retry mechanisms

### **Medium Risks**
1. **User Interface Complexity**: Too many options confusing operators
   - **Mitigation**: User testing and iterative design
   
2. **Role-based Logic**: Incorrect permission handling
   - **Mitigation**: Comprehensive authorization testing

## 🎯 Next Immediate Actions

1. **Start with Database Schema** - Extend current schema for alerts
2. **Implement tRPC Procedures** - Core API functionality
3. **Create Operator Dashboard** - Primary user interface
4. **Set up Basic Notifications** - Core notification system
5. **Test End-to-End Flow** - Validate complete functionality

**Estimated Timeline**: 2 weeks for Phase 2 core functionality
**Dependencies**: None (Auth system complete)
**Blockers**: None identified

This plan provides a clear roadmap for implementing the alert system while maintaining the high code quality standards established in Phase 1.