import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { View, Dimensions } from "react-native"
// Removed card imports - using Box instead
import { Button } from '@/components/universal/interaction/Button'
import { HStack } from '@/components/universal/layout/Stack'
import { Box } from '@/components/universal/layout/Box'
import { Text } from '@/components/universal/typography/Text'
import { SpacingScale } from "@/lib/design"
import { useTheme } from "@/lib/theme/provider"
import { useBreakpoint } from '@/hooks/responsive';

export const description = "An interactive area chart"

// Generate sample data
const generateChartData = () => {
  const data = []
  const now = new Date()
  
  for (let i = 120; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    const baseDesktop = 250 + Math.random() * 250
    const baseMobile = 150 + Math.random() * 250
    
    data.push({
      date: date.toISOString().split('T')[0],
      desktop: Math.floor(baseDesktop),
      mobile: Math.floor(baseMobile),
    })
  }
  
  return data
}

const chartData = generateChartData()

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  const theme = useTheme()
  
  if (active && payload && payload.length) {
    return (
      <View style={{
        backgroundColor: theme.popover,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 6,
        padding: 8,
        boxShadow: '0px 2px 4px theme.mutedForeground + "10"',
      }}>
        <Text style={{ fontSize: 12, color: theme.mutedForeground, marginBottom: 4 }}>
          {new Date(label).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        {payload.map((entry: any, index: number) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: entry.color,
              marginRight: 6,
            }} />
            <Text style={{ fontSize: 12, color: theme.mutedForeground, marginRight: 4 }}>
              {entry.name}:
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.foreground }}>
              {entry.value.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    )
  }
  
  return null
}

export function AreaChartInteractive() {
  const theme = useTheme()
  const breakpoint = useBreakpoint()
  const [isMobile, setIsMobile] = React.useState(false)
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    const updateIsMobile = () => {
      const { width } = Dimensions.get('window')
      setIsMobile(width < 768)
    }
    
    updateIsMobile()
    const subscription = Dimensions.addEventListener('change', updateIsMobile)
    return () => subscription?.remove()
  }, [])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    const now = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    
    return chartData.filter((item) => {
      const date = new Date(item.date)
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - daysToSubtract)
      return date >= startDate
    })
  }, [timeRange])

  const chartConfig = React.useMemo(() => ({
    desktop: {
      label: "Desktop",
      color: theme.primary || "#3b82f6",
    },
    mobile: {
      label: "Mobile",
      color: theme.accent || "#8b5cf6",
    },
  }), [theme.primary, theme.accent])

  return (
    <Box 
      bgTheme="card" 
      borderWidth={1} 
      borderTheme="border" 
      rounded="lg" 
      style={{ overflow: 'hidden' }}
    >
      <Box p={4 as SpacingScale}>
        <Box>
          <HStack justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Text size="lg" weight="semibold" colorTheme="foreground">
                Visitor Analytics
              </Text>
              <Text size="sm" colorTheme="mutedForeground" style={{ marginTop: 4 }}>
                Track your website visitors by device type
              </Text>
            </Box>
            <HStack spacing={1}>
              <Button
                size="sm"
                variant={timeRange === "7d" ? "secondary" : "ghost"}
                onPress={() => setTimeRange("7d")}
              >
                {isMobile ? "7d" : "Last 7 days"}
              </Button>
              <Button
                size="sm"
                variant={timeRange === "30d" ? "secondary" : "ghost"}
                onPress={() => setTimeRange("30d")}
              >
                {isMobile ? "30d" : "Last 30 days"}
              </Button>
              <Button
                size="sm"
                variant={timeRange === "90d" ? "secondary" : "ghost"}
                onPress={() => setTimeRange("90d")}
              >
                {isMobile ? "3m" : "Last 3 months"}
              </Button>
            </HStack>
          </HStack>
        </Box>
      </Box>
      <Box px={0 as SpacingScale} pb={4 as SpacingScale}>
        <div style={{ 
          height: 250, 
          width: '100%', 
          paddingLeft: 16,
          paddingRight: 16,
          transition: 'all 0.3s ease-in-out',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text colorTheme="mutedForeground">
            Chart temporarily disabled due to rendering loop
          </Text>
        </div>
      </Box>
    </Box>
  )
}