# Component Library Index

Complete reference for all 48+ universal components in the design system.

## Layout Components

### Box
Fundamental layout component with spacing and styling props.
```tsx
<Box p={4} bg="card" rounded="lg">
  Content
</Box>
```

### Container
Responsive container with max-width constraints.
```tsx
<Container maxWidth="4xl" px={4}>
  Page content
</Container>
```

### Grid
Flexible grid layout system.
```tsx
<Grid cols={3} gap={4}>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
</Grid>
```

### Stack (VStack/HStack)
Vertical and horizontal stack layouts.
```tsx
<VStack space={4} align="center">
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</VStack>
```

### ScrollContainer
Scrollable container with pull-to-refresh support.
```tsx
<ScrollContainer onRefresh={handleRefresh}>
  {content}
</ScrollContainer>
```

## Typography

### Text
Base text component with variants.
```tsx
<Text size="lg" weight="bold" color="primary">
  Hello World
</Text>
```

### Heading (1-6)
Semantic heading components.
```tsx
<Heading1>Page Title</Heading1>
<Heading2>Section Title</Heading2>
```

## Form Components

### Input
Text input with validation support.
```tsx
<Input
  label="Email"
  placeholder="Enter email"
  error={errors.email}
  leftIcon="mail"
/>
```

### Button
Versatile button with variants.
```tsx
<Button 
  variant="primary"
  size="lg"
  onPress={handleSubmit}
  loading={isLoading}
>
  Submit
</Button>
```

### Form
Form wrapper with validation.
```tsx
<Form onSubmit={handleSubmit}>
  <FormInput name="email" label="Email" />
  <FormSubmit>Submit</FormSubmit>
</Form>
```

### Select
Dropdown selection component.
```tsx
<Select
  label="Role"
  options={roleOptions}
  value={role}
  onChange={setRole}
/>
```

### Checkbox
Checkbox with label.
```tsx
<Checkbox
  label="I agree to terms"
  checked={agreed}
  onChange={setAgreed}
/>
```

### RadioGroup
Radio button group.
```tsx
<RadioGroup
  options={options}
  value={selected}
  onChange={setSelected}
/>
```

### Switch
Toggle switch component.
```tsx
<Switch
  label="Enable notifications"
  checked={enabled}
  onChange={setEnabled}
/>
```

## Navigation

### Tabs
Tab navigation component.
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Breadcrumb
Breadcrumb navigation.
```tsx
<Breadcrumb>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/products">Products</BreadcrumbItem>
  <BreadcrumbItem>Current Page</BreadcrumbItem>
</Breadcrumb>
```

### NavigationMenu
Dropdown navigation menu.
```tsx
<NavigationMenu>
  <NavigationMenuItem>
    <NavigationMenuTrigger>Products</NavigationMenuTrigger>
    <NavigationMenuContent>
      {/* Menu items */}
    </NavigationMenuContent>
  </NavigationMenuItem>
</NavigationMenu>
```

### Sidebar
Collapsible sidebar navigation.
```tsx
<Sidebar>
  <SidebarHeader>App Name</SidebarHeader>
  <SidebarContent>
    <NavMain items={navItems} />
  </SidebarContent>
</Sidebar>
```

## Feedback

### Toast
Toast notifications.
```tsx
const { toast } = useToast();

toast({
  title: "Success",
  description: "Operation completed",
  variant: "success"
});
```

### Alert
Alert messages with variants.
```tsx
<Alert variant="warning">
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    This action cannot be undone.
  </AlertDescription>
</Alert>
```

### Dialog
Modal dialog component.
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Progress
Progress indicator.
```tsx
<Progress value={60} max={100} />
```

### Skeleton
Loading skeleton placeholder.
```tsx
<Skeleton className="h-12 w-full" />
```

## Data Display

### Card
Card container component.
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
</Card>
```

### Table
Data table component.
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Badge
Status badge component.
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
```

### Avatar
User avatar component.
```tsx
<Avatar
  src={user.avatar}
  alt={user.name}
  fallback={user.initials}
  size="lg"
/>
```

### Stats
Statistics display component.
```tsx
<Stats>
  <StatCard
    title="Total Users"
    value="1,234"
    change="+12%"
    trend="up"
  />
</Stats>
```

### Timeline
Timeline component for events.
```tsx
<Timeline>
  <TimelineItem>
    <TimelineContent>
      <TimelineTitle>Event 1</TimelineTitle>
      <TimelineDescription>Description</TimelineDescription>
    </TimelineContent>
  </TimelineItem>
</Timeline>
```

## Charts

### AreaChart
Area chart visualization.
```tsx
<AreaChart
  data={data}
  categories={['Sales', 'Revenue']}
  index="month"
/>
```

### BarChart
Bar chart visualization.
```tsx
<BarChart
  data={data}
  categories={['Product A', 'Product B']}
  index="month"
/>
```

### LineChart
Line chart visualization.
```tsx
<LineChart
  data={data}
  categories={['2023', '2024']}
  index="month"
/>
```

### PieChart
Pie chart visualization.
```tsx
<PieChart
  data={data}
  category="sales"
  index="product"
/>
```

## Overlays

### Drawer
Slide-out drawer component.
```tsx
<Drawer open={open} onOpenChange={setOpen}>
  <DrawerTrigger>Open Drawer</DrawerTrigger>
  <DrawerContent>
    {/* Drawer content */}
  </DrawerContent>
</Drawer>
```

### Popover
Popover overlay.
```tsx
<Popover>
  <PopoverTrigger>Open</PopoverTrigger>
  <PopoverContent>
    Popover content
  </PopoverContent>
</Popover>
```

### Tooltip
Tooltip component.
```tsx
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>
    Tooltip text
  </TooltipContent>
</Tooltip>
```

### Sheet
Bottom sheet component.
```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger>Open Sheet</SheetTrigger>
  <SheetContent>
    {/* Sheet content */}
  </SheetContent>
</Sheet>
```

### ContextMenu
Right-click context menu.
```tsx
<ContextMenu>
  <ContextMenuTrigger>Right click me</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Copy</ContextMenuItem>
    <ContextMenuItem>Paste</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

## Specialized

### ColorPicker
Color selection component.
```tsx
<ColorPicker
  value={color}
  onChange={setColor}
/>
```

### DatePicker
Date selection component.
```tsx
<DatePicker
  value={date}
  onChange={setDate}
  minDate={new Date()}
/>
```

### FilePicker
File upload component.
```tsx
<FilePicker
  accept="image/*"
  onSelect={handleFileSelect}
  multiple
/>
```

### Stepper
Step-by-step process component.
```tsx
<Stepper activeStep={currentStep}>
  <Step>
    <StepLabel>Step 1</StepLabel>
  </Step>
  <Step>
    <StepLabel>Step 2</StepLabel>
  </Step>
</Stepper>
```

### Rating
Star rating component.
```tsx
<Rating
  value={rating}
  onChange={setRating}
  max={5}
/>
```

## Utility Components

### EmptyState
Empty state placeholder.
```tsx
<EmptyState
  icon="inbox"
  title="No items"
  description="Start by creating your first item"
  action={
    <Button onPress={handleCreate}>
      Create Item
    </Button>
  }
/>
```

### ErrorDisplay
Error state display.
```tsx
<ErrorDisplay
  error={error}
  onRetry={handleRetry}
/>
```

### Link
Navigation link component.
```tsx
<Link href="/about" variant="primary">
  Learn more
</Link>
```

### Separator
Visual separator line.
```tsx
<Separator orientation="horizontal" />
```

### Toggle
Toggle button component.
```tsx
<ToggleGroup value={view} onValueChange={setView}>
  <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
  <ToggleGroupItem value="list">List</ToggleGroupItem>
</ToggleGroup>
```

## Icons

### Symbols
SF Symbols / Icon component.
```tsx
<Symbols
  name="house.fill"
  size={24}
  color="primary"
/>
```

## Component Props

Most components accept these common props:
- `className` - Additional CSS classes
- `style` - Inline styles
- `children` - Child elements
- `testID` - Testing identifier

## Theming

All components respect the current theme and can be customized through:
- Theme colors: `primary`, `secondary`, `accent`, etc.
- Spacing system: `spacing.xs` through `spacing.xxxl`
- Typography scales: `typography.h1` through `typography.small`
- Border radius: `rounded.sm` through `rounded.full`

## Responsive Design

Components support responsive props:
```tsx
<Box 
  p={{ base: 2, sm: 4, md: 6 }}
  display={{ base: 'block', lg: 'flex' }}
>
  Responsive content
</Box>
```