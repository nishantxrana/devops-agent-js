import React, { useState } from 'react'
import { 
  Palette, 
  Type,
  Square,
  MousePointer,
  Eye,
  MessageSquare,
  Play,
  Home,
  Settings,
  Check,
  X,
  AlertTriangle,
  Info,
  Zap,
  Moon,
  Sun,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input, Label, FormField, Textarea } from '../components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { PageHeader } from '../components/ui/page-header'
import { Skeleton } from '../components/ui/skeleton'
import { EmptyState, ErrorState } from '../components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'

// Color Palette Component
const ColorPalette = () => {
  const colors = [
    { name: 'Primary', base: 'primary', shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: 'Neutral', base: 'neutral', shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: 'Success', base: 'success', shades: [50, 500, 600] },
    { name: 'Warning', base: 'warning', shades: [50, 500, 600] },
    { name: 'Error', base: 'error', shades: [50, 500, 600] },
    { name: 'Info', base: 'info', shades: [50, 500, 600] }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary-600" />
          Color System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {colors.map((color) => (
          <div key={color.name} className="space-y-2">
            <h4 className="text-h4 font-medium text-neutral-900 dark:text-neutral-50">
              {color.name}
            </h4>
            <div className="flex flex-wrap gap-2">
              {color.shades.map((shade) => (
                <div
                  key={shade}
                  className={`relative group w-16 h-16 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-300 bg-${color.base}-${shade} cursor-pointer`}
                  title={`${color.base}-${shade}`}
                >
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center">
                    <span className="text-white text-caption font-medium">{shade}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Typography Component
const Typography = () => {
  const typographyScale = [
    { name: 'Display', class: 'text-display', text: 'Display Text' },
    { name: 'Headline 1', class: 'text-h1', text: 'Headline 1' },
    { name: 'Headline 2', class: 'text-h2', text: 'Headline 2' },
    { name: 'Headline 3', class: 'text-h3', text: 'Headline 3' },
    { name: 'Headline 4', class: 'text-h4', text: 'Headline 4' },
    { name: 'Body Large', class: 'text-body-lg', text: 'Body Large text for emphasis' },
    { name: 'Body', class: 'text-body', text: 'Regular body text for content' },
    { name: 'Body Small', class: 'text-body-sm', text: 'Small body text for details' },
    { name: 'Caption', class: 'text-caption', text: 'Caption text for metadata' },
    { name: 'Label', class: 'text-label', text: 'LABEL TEXT' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5 text-info-600" />
          Typography Scale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {typographyScale.map((type) => (
          <div key={type.name} className="flex items-baseline gap-4 border-b border-neutral-200 pb-2 dark:border-neutral-300">
            <div className="w-24 text-caption text-neutral-500 shrink-0">
              {type.name}
            </div>
            <div className={`${type.class} text-neutral-900 dark:text-neutral-50`}>
              {type.text}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Button Variants Component
const ButtonVariants = () => {
  const variants = [
    { name: 'Primary', variant: 'primary' },
    { name: 'Secondary', variant: 'secondary' },
    { name: 'Outline', variant: 'outline' },
    { name: 'Ghost', variant: 'ghost' },
    { name: 'Danger', variant: 'danger' },
    { name: 'Success', variant: 'success' }
  ]

  const sizes = [
    { name: 'Small', size: 'sm' },
    { name: 'Medium', size: 'md' },
    { name: 'Large', size: 'lg' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MousePointer className="h-5 w-5 text-success-600" />
          Button Components
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Variants */}
        <div className="space-y-4">
          <h4 className="text-h4 font-medium text-neutral-900 dark:text-neutral-50">Variants</h4>
          <div className="flex flex-wrap gap-3">
            {variants.map((variant) => (
              <Button key={variant.name} variant={variant.variant}>
                {variant.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-4">
          <h4 className="text-h4 font-medium text-neutral-900 dark:text-neutral-50">Sizes</h4>
          <div className="flex flex-wrap items-end gap-3">
            {sizes.map((size) => (
              <Button key={size.name} size={size.size}>
                {size.name}
              </Button>
            ))}
          </div>
        </div>

        {/* States */}
        <div className="space-y-4">
          <h4 className="text-h4 font-medium text-neutral-900 dark:text-neutral-50">States</h4>
          <div className="flex flex-wrap gap-3">
            <Button>Normal</Button>
            <Button disabled>Disabled</Button>
            <Button>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Form Components
const FormComponents = () => {
  const [selectValue, setSelectValue] = useState('')
  const [checkboxChecked, setCheckboxChecked] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Square className="h-5 w-5 text-warning-600" />
          Form Components
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-w-md">
        <FormField label="Text Input" required>
          <Input placeholder="Enter your name" />
        </FormField>

        <FormField label="Text Input with Error" error="This field is required">
          <Input placeholder="Invalid input" error />
        </FormField>

        <FormField label="Textarea">
          <Textarea placeholder="Enter your message..." />
        </FormField>

        <FormField label="Select Dropdown">
          <Select value={selectValue} onValueChange={setSelectValue}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="checkbox-demo"
            checked={checkboxChecked}
            onCheckedChange={setCheckboxChecked}
          />
          <Label htmlFor="checkbox-demo">Accept terms and conditions</Label>
        </div>
      </CardContent>
    </Card>
  )
}

// Interactive Components
const InteractiveComponents = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-error-600" />
          Interactive Components
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dialog */}
        <div className="space-y-2">
          <h4 className="text-h4 font-medium text-neutral-900 dark:text-neutral-50">Dialog</h4>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Example Dialog</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-body-sm text-neutral-600 dark:text-neutral-400">
                  This is an example dialog built with Radix UI primitives and styled with our design system.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading States */}
        <div className="space-y-2">
          <h4 className="text-h4 font-medium text-neutral-900 dark:text-neutral-50">Loading States</h4>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        {/* Empty States */}
        <div className="space-y-2">
          <h4 className="text-h4 font-medium text-neutral-900 dark:text-neutral-50">Empty State</h4>
          <div className="border border-neutral-200 rounded-lg dark:border-neutral-300">
            <EmptyState
              title="No items found"
              description="Get started by creating your first item."
              actionLabel="Create Item"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Icons Showcase
const IconsShowcase = () => {
  const icons = [
    { Icon: Home, name: 'Home' },
    { Icon: Settings, name: 'Settings' },
    { Icon: Check, name: 'Check' },
    { Icon: X, name: 'X' },
    { Icon: AlertTriangle, name: 'AlertTriangle' },
    { Icon: Info, name: 'Info' },
    { Icon: Zap, name: 'Zap' },
    { Icon: Moon, name: 'Moon' },
    { Icon: Sun, name: 'Sun' },
    { Icon: RefreshCw, name: 'RefreshCw' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-neutral-600" />
          Lucide Icons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {icons.map((icon) => (
            <div
              key={icon.name}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-300 dark:hover:bg-neutral-200 transition-colors"
            >
              <icon.Icon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
              <span className="text-caption text-neutral-500 text-center">{icon.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ComponentGallery() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Component Gallery"
        description="Showcase of our design system components and patterns"
      />

      <div className="space-y-8">
        {/* Design Tokens */}
        <section className="space-y-6">
          <h2 className="text-h2 font-semibold text-neutral-900 dark:text-neutral-50">
            Design Tokens
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ColorPalette />
            <Typography />
          </div>
        </section>

        {/* Components */}
        <section className="space-y-6">
          <h2 className="text-h2 font-semibold text-neutral-900 dark:text-neutral-50">
            Components
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ButtonVariants />
            <FormComponents />
            <InteractiveComponents />
            <IconsShowcase />
          </div>
        </section>
      </div>
    </div>
  )
}