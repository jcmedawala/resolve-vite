"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    _id: Id<"users">
    email?: string
    firstName?: string
    lastName?: string
    role?: string
    isPeopleManager?: boolean | string
    teamLead?: string | null
    isActive?: boolean
  }
  isEditingSelf?: boolean
}

export function EditUserDialog({ open, onOpenChange, user, isEditingSelf = false }: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const updateUser = useMutation(api.team.updateUser)
  const teamLeads = useQuery(api.team.getTeamLeads)

  const [formData, setFormData] = useState({
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    role: user.role || "KYC Analyst",
    isPeopleManager: user.isPeopleManager === true || user.isPeopleManager === "Yes" || user.isPeopleManager === "yes",
    teamLead: user.teamLead || null,
    isActive: user.isActive ?? true,
  })

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role || "KYC Analyst",
      isPeopleManager: user.isPeopleManager === true || user.isPeopleManager === "Yes" || user.isPeopleManager === "yes",
      teamLead: user.teamLead || null,
      isActive: user.isActive ?? true,
    })
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateUser({
        userId: user._id,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        isPeopleManager: formData.isPeopleManager,
        teamLead: formData.teamLead,
        isActive: formData.isActive,
      })

      toast.success("User updated successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={isEditingSelf}
              >
                <SelectTrigger id="edit-role" className={isEditingSelf ? "cursor-not-allowed" : ""}>
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
                {isEditingSelf ? "You cannot change your own role" : "Determines user permissions and access levels"}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-teamLead">Reporting Manager</Label>
              <Select
                value={formData.teamLead || "none"}
                onValueChange={(value) => setFormData({ ...formData, teamLead: value === "none" ? null : value })}
              >
                <SelectTrigger id="edit-teamLead">
                  <SelectValue placeholder="Select team lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Team Lead</SelectItem>
                  {teamLeads?.filter(lead => lead._id !== user._id).map((lead) => (
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
                  id="edit-isPeopleManager"
                  checked={formData.isPeopleManager}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPeopleManager: checked === true })}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="edit-isPeopleManager" className="text-sm font-medium cursor-pointer">
                    People Manager
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This user will manage and oversee other team members
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
                  disabled={isEditingSelf}
                  className={isEditingSelf ? "cursor-not-allowed" : ""}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="edit-isActive" className={`text-sm font-medium ${isEditingSelf ? "text-muted-foreground" : "cursor-pointer"}`}>
                    Active Account
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isEditingSelf ? "You cannot deactivate your own account" : "Inactive users cannot log in"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
