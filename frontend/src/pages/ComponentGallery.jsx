import React, { useState } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Star,
  Heart,
  Download,
  Upload,
  Settings,
  User,
  Bell,
  Search,
  Filter,
  Calendar,
  Clock,
  Globe,
  Shield,
  Zap,
  Trash2,
  Edit,
  Save,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// Import all shadcn components to showcase
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toggle } from '@/components/ui/toggle'

function ComponentSection({ title, description, children }) {
  return (
    <Card className="p-6">
      <div className="space-y-2 mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  )
}

function CodeBlock({ children }) {
  return (
    <div className="bg-muted p-3 rounded-md font-mono text-sm">
      {children}
    </div>
  )
}

export default function ComponentGallery() {
  const [progress, setProgress] = useState(65)
  const [switchState, setSwitchState] = useState(true)
  const [sliderValue, setSliderValue] = useState([50])
  const { toast } = useToast()

  const showToast = (variant = "default") => {
    toast({
      title: variant === "destructive" ? "Error occurred" : "Success!",
      description: variant === "destructive" ? "Something went wrong." : "This is a toast notification.",
      variant,
    })
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Component Gallery</h1>
        <p className="text-muted-foreground">
          Showcase of all shadcn/ui components used in the DevOps Agent application
        </p>
      </div>

      <Tabs defaultValue="buttons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="buttons">Buttons & Inputs</TabsTrigger>
          <TabsTrigger value="data">Data Display</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="overlays">Overlays</TabsTrigger>
        </TabsList>

        {/* Buttons & Inputs */}
        <TabsContent value="buttons" className="space-y-6">
          <ComponentSection 
            title="Buttons" 
            description="Various button styles and states"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Default Buttons</Label>
                <div className="space-y-2">
                  <Button>Primary Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>States & Sizes</Label>
                <div className="space-y-2">
                  <Button disabled>Disabled</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>With Icons</Label>
                <div className="space-y-2">
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection 
            title="Form Inputs" 
            description="Input fields and form controls"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-input">Text Input</Label>
                  <Input id="text-input" placeholder="Enter some text..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textarea">Textarea</Label>
                  <Textarea id="textarea" placeholder="Enter a longer message..." />
                </div>

                <div className="space-y-2">
                  <Label>Select Dropdown</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="demo-switch" 
                    checked={switchState}
                    onCheckedChange={setSwitchState}
                  />
                  <Label htmlFor="demo-switch">Enable notifications</Label>
                </div>

                <div className="space-y-2">
                  <Label>Progress: {progress}%</Label>
                  <Progress value={progress} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Slider: {sliderValue[0]}</Label>
                  <Slider
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </ComponentSection>
        </TabsContent>

        {/* Data Display */}
        <TabsContent value="data" className="space-y-6">
          <ComponentSection 
            title="Badges & Status" 
            description="Various badge styles and status indicators"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Badge Variants</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status Badges</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Success
                  </Badge>
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Error
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                </div>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection 
            title="Data Table" 
            description="Table component with proper styling"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Work Item #123</TableCell>
                  <TableCell>
                    <Badge className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>High</TableCell>
                  <TableCell>2024-01-15</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Work Item #124</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  </TableCell>
                  <TableCell>Medium</TableCell>
                  <TableCell>2024-01-20</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ComponentSection>

          <ComponentSection 
            title="Avatars & Skeletons" 
            description="User avatars and loading states"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Avatars</Label>
                <div className="flex gap-2">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Loading Skeletons</Label>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          </ComponentSection>
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback" className="space-y-6">
          <ComponentSection 
            title="Alerts" 
            description="Alert messages for different scenarios"
          >
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  This is a general information alert.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Something went wrong. Please try again.
                </AlertDescription>
              </Alert>

              <Alert className="border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Operation completed successfully!
                </AlertDescription>
              </Alert>
            </div>
          </ComponentSection>

          <ComponentSection 
            title="Toast Notifications" 
            description="Toast messages for user feedback"
          >
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => showToast()}>Show Success Toast</Button>
              <Button variant="destructive" onClick={() => showToast("destructive")}>
                Show Error Toast
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover for Tooltip</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is a tooltip message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </ComponentSection>
        </TabsContent>

        {/* Layout */}
        <TabsContent value="layout" className="space-y-6">
          <ComponentSection 
            title="Cards" 
            description="Card layouts with headers and content"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Simple Card</CardTitle>
                  <CardDescription>Basic card with header</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This is the card content area.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Featured Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Card with icon in header.</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p>Content-only card</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ComponentSection>

          <ComponentSection 
            title="Separators & Spacing" 
            description="Visual separators and layout helpers"
          >
            <div className="space-y-4">
              <div>
                <p>Content above separator</p>
                <Separator className="my-4" />
                <p>Content below separator</p>
              </div>
            </div>
          </ComponentSection>

          <ComponentSection 
            title="Accordion" 
            description="Collapsible content sections"
          >
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Configuration Settings</AccordionTrigger>
                <AccordionContent>
                  Configure your application settings here. This section contains
                  various options for customizing your experience.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Advanced Options</AccordionTrigger>
                <AccordionContent>
                  Advanced configuration options for power users. These settings
                  should be modified with caution.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Help & Support</AccordionTrigger>
                <AccordionContent>
                  Find help documentation and support resources here.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ComponentSection>
        </TabsContent>

        {/* Overlays */}
        <TabsContent value="overlays" className="space-y-6">
          <ComponentSection 
            title="Dialogs" 
            description="Modal dialogs and overlays"
          >
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Example Dialog</DialogTitle>
                    <DialogDescription>
                      This is an example dialog with some content.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="dialog-input">Name</Label>
                      <Input id="dialog-input" placeholder="Enter your name" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </ComponentSection>

          <ComponentSection 
            title="Dropdown Menus" 
            description="Contextual menus and dropdowns"
          >
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Actions
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-red-600">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Toggle>
                <Star className="h-4 w-4" />
              </Toggle>
            </div>
          </ComponentSection>
        </TabsContent>
      </Tabs>
    </div>
  )
}