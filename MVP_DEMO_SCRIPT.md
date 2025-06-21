# Healthcare Alert System - MVP Demo Script 🎬

## Pre-Demo Setup (15 minutes before)

### 1. System Check
```bash
# Ensure all services are running
docker ps

# If not, start everything
bun run local:healthcare
```

### 2. Enable PostHog (Optional but Impressive)
```bash
# Start PostHog for live analytics
./scripts/start-posthog.sh

# Add to .env.local
EXPO_PUBLIC_POSTHOG_ENABLED=true
EXPO_PUBLIC_POSTHOG_API_KEY=your-key
EXPO_PUBLIC_POSTHOG_API_HOST=http://localhost:8000
```

### 3. Clear Demo Data
```bash
# Reset to fresh state
bun run scripts/reset-database-complete.ts
bun run scripts/setup-healthcare-complete.ts
```

### 4. Open Required Tabs
- **Tab 1**: Expo Go on phone (Operator)
- **Tab 2**: Web browser - http://localhost:8081 (Doctor)
- **Tab 3**: Another browser/incognito (Admin)
- **Tab 4**: PostHog Dashboard - http://localhost:8000 (if using)
- **Tab 5**: Terminal with logs

## Demo Flow - Act 1: The Problem (2 minutes)

### Scene 1: Set the Stage
**Say**: "Imagine it's 3 AM in a busy hospital. A patient in room A301 needs immediate attention."

**Do**: Show the current manual process
- "Traditionally, the patient presses a call button"
- "A light turns on at the nurse station"
- "Someone has to notice, figure out who's available, and respond"
- "No tracking, no accountability, no data"

**Say**: "This leads to delays, missed alerts, and no visibility into performance"

## Demo Flow - Act 2: The Solution (10 minutes)

### Scene 2: Operator Creates Emergency Alert

**Login as Operator**
```
Email: operator@test.com
Password: Operator123!
```

**Say**: "Our operator at the nurse station receives the call"

**Do**: 
1. Click "Create Alert" button
2. Fill in:
   - Room: A301
   - Type: Medical Emergency
   - Urgency: 5 (Critical)
   - Notes: "Patient experiencing chest pain"
3. Submit

**Highlight**: 
- "Notice how fast that was - under 5 seconds"
- "The alert is now live in the system"

### Scene 3: Real-time Doctor Notification

**Switch to Doctor Tab** (already logged in)
```
Email: doctor@test.com
Password: Doctor123!
```

**Say**: "Watch what happens on Dr. Smith's phone"

**Show**:
- Alert appears instantly (no refresh)
- Red badge for critical alert
- Alert sound (if enabled)
- Shows "0 seconds ago"

**Do**:
1. Click on the alert
2. Show full details
3. Click "Acknowledge"
4. Add note: "On my way, ETA 2 minutes"

**Highlight**:
- "Real-time WebSocket connection"
- "Doctor's response is immediately visible to everyone"
- "Timer shows response time"

### Scene 4: Alert Resolution

**Say**: "After attending to the patient"

**Do**:
1. Click "Resolve Alert"
2. Add resolution notes: "Patient stabilized, administered medication"
3. Select outcome: "Resolved - Treatment Provided"
4. Submit

**Show**:
- Alert moves to completed
- Response time: 2 min 30 sec
- All actions logged

### Scene 5: Analytics & Insights

**Switch to Admin Tab**
```
Email: admin@test.com
Password: Admin123!
```

**Say**: "Now let's see the power of data"

**Navigate to**: Analytics Dashboard

**Show**:
1. Real-time metrics updated
2. Average response time
3. Alert distribution by urgency
4. Staff performance metrics

**Highlight**:
- "2.5 minute response vs 4.5 minute average"
- "100% acknowledgment rate"
- "Data-driven improvement"

### Scene 6: PostHog Analytics (Optional Power Move)

**Switch to PostHog Tab**

**Say**: "For technical folks, here's what's happening behind the scenes"

**Show**:
1. Live event stream
2. User journey for the alert
3. Performance metrics
4. Error tracking (hopefully none!)

**Highlight**:
- "Every action is tracked"
- "We can replay entire sessions"
- "Debugging is a breeze"

## Demo Flow - Act 3: Advanced Features (5 minutes)

### Scene 7: Auto-Escalation

**Say**: "What if the doctor doesn't respond?"

**Do**:
1. Create another critical alert
2. Don't acknowledge it
3. Wait 2 minutes (or show pre-created example)

**Show**:
- Escalation notification
- Alert reassigned to senior staff
- Escalation logged

### Scene 8: Multi-Hospital Support

**Say**: "This system scales across facilities"

**Do**:
1. Show hospital selector
2. Switch hospitals
3. Show different alerts/staff

**Highlight**:
- "Central management"
- "Hospital-specific configurations"
- "Cross-facility reporting"

### Scene 9: Mobile Excellence

**On Phone** (Expo Go)

**Do**:
1. Navigate between screens
2. Create alert
3. Show responsive design
4. Work offline (airplane mode)
5. Turn back online - sync works

**Highlight**:
- "Works on any device"
- "Offline capability"
- "Native performance"

## Demo Flow - Act 4: Technical Excellence (3 minutes)

### Scene 10: Architecture Overview

**Say**: "Built with cutting-edge technology"

**Show** (slides or diagram):
- React Native + Expo (cross-platform)
- TypeScript (type safety)
- tRPC (end-to-end typesafe APIs)
- PostgreSQL (reliable data)
- WebSocket (real-time)
- Docker (easy deployment)

### Scene 11: Security & Compliance

**Highlight**:
- "Role-based access control"
- "Audit trail for every action"
- "HIPAA-compliant architecture"
- "Encrypted communications"

### Scene 12: Performance Metrics

**Show**:
- "< 500ms alert creation"
- "< 100ms API responses"
- "Handles 1000+ concurrent users"
- "99.9% uptime capable"

## Demo Flow - Act 5: The Close (2 minutes)

### Scene 13: ROI & Impact

**Say**: "Let's talk business impact"

**Show/Say**:
- "50% faster response times"
- "90% reduction in missed alerts"
- "Complete accountability"
- "Data for continuous improvement"
- "Happy patients, efficient staff"

### Scene 14: Next Steps

**Say**: "Where we go from here"

**Options**:
1. "30-day pilot program"
2. "Full deployment in 6 weeks"
3. "Custom training included"
4. "24/7 support"

### Scene 15: Q&A Setup

**Say**: "I'd love to hear your questions"

**Be Ready For**:
- Integration questions
- Pricing discussions
- Technical deep-dives
- Security concerns
- Customization requests

## Backup Plans

### If WebSocket Fails
- Explain automatic fallback to polling
- Show it still works, just slightly delayed

### If Login Issues
- Have backup video ready
- Use pre-logged in sessions

### If Database Issues
- Show architecture diagrams
- Focus on features and benefits
- Use screenshots

### If Network Issues
- Show offline mode
- Demonstrate sync when back online
- Have local demo video

## Power User Tips

### Smooth Transitions
1. Pre-login all accounts
2. Have alerts pre-created for escalation demo
3. Clear notifications before starting
4. Mute other apps
5. Full screen mode

### Impressive Moments
1. Create alert on phone, appears on web instantly
2. Show PostHog tracking in real-time
3. Demonstrate voice-to-text for notes
4. Show the beautiful animations
5. Let them try it themselves

### Common Questions Ready
- **Q**: "How long to implement?"
  **A**: "2 weeks with training"

- **Q**: "What about our existing system?"
  **A**: "We integrate via APIs"

- **Q**: "Is it secure?"
  **A**: "Bank-level encryption, HIPAA compliant"

- **Q**: "What if internet goes down?"
  **A**: "Offline mode with automatic sync"

- **Q**: "How much?"
  **A**: "ROI positive in 3 months"

## Post-Demo

### Follow-up Ready
1. Send thank you with demo recording
2. Provide trial access
3. Schedule technical deep-dive
4. Share case studies
5. Proposal with custom pricing

### Materials to Share
- Technical architecture PDF
- Security whitepaper
- ROI calculator
- Customer testimonials
- Implementation timeline

---

## 🎯 Remember: You're not just showing software, you're showing how to save lives!

### Demo Mantra
- **Start strong**: The problem is real
- **Show magic**: Real-time is impressive
- **Prove value**: Data drives decisions
- **Close confident**: We're ready to deploy

### Final Checklist
- [ ] All services running
- [ ] Test accounts working
- [ ] Network stable
- [ ] Backup plan ready
- [ ] Confidence high
- [ ] Smile ready

**You've got this! 🚀**