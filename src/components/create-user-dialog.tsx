"use client"

import { useState } from "react"
import { useQuery, useAction } from "convex/react"
import { api } from "../../convex/_generated/api"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createUser = useAction(api.team.createUser)
  const teamLeads = useQuery(api.team.getTeamLeads)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "KYC Analyst",
    isPeopleManager: false,
    teamLead: null as string | null,
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        isPeopleManager: formData.isPeopleManager,
        teamLead: formData.teamLead,
        isActive: formData.isActive,
      })

      toast.success("User created successfully")
      setOpen(false)

      // Reset form
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "KYC Analyst",
        isPeopleManager: false,
        teamLead: null,
        isActive: true,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member to Edison Resolve. All new accounts are created as active by default.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@edisonresolve.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be used for login and notifications
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long. User will use this to log in.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Ops Admin">Ops Admin</SelectItem>
                  <SelectItem value="KYC Analyst">KYC Analyst</SelectItem>
                  <SelectItem value="QC Analyst">QC Analyst</SelectItem>
                  <SelectItem value="Team Lead">Team Lead</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Determines user permissions and access levels
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teamLead">Reporting Manager</Label>
              <Select
                value={formData.teamLead || "none"}
                onValueChange={(value) => setFormData({ ...formData, teamLead: value === "none" ? null : value })}
              >
                <SelectTrigger id="teamLead">
                  <SelectValue placeholder="Select team lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Team Lead</SelectItem>
                  {teamLeads?.map((lead) => (
                    <SelectItem key={lead._id} value={lead.name || `${lead.firstName} ${lead.lastName}`}>
                      {lead.name || `${lead.firstName} ${lead.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select this user's direct manager (optional)
              </p>
            </div>
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isPeopleManager"
                  checked={formData.isPeopleManager}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPeopleManager: checked === true })}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="isPeopleManager" className="text-sm font-medium cursor-pointer">
                    People Manager
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This user will manage and oversee other team members
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  disabled
                  className="cursor-not-allowed"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="isActive" className="text-sm font-medium text-muted-foreground">
                    Active Account
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    All new accounts are created as active by default
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
