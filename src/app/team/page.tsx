"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { EditUserDialog } from "@/components/edit-user-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconShieldCheckFilled,
  IconUserFilled,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconShieldFilled,
  IconDotsVertical,
} from "@tabler/icons-react"
import { toast } from "sonner"

export default function TeamPage() {
  const canAccessTeam = useQuery(api.team.canAccessTeamPage)
  const isAdmin = useQuery(api.team.isAdmin)
  // Only fetch users if user has access - prevents error when access is revoked
  const users = useQuery(api.team.getAllUsers, canAccessTeam === false ? "skip" : {})
  const currentUserId = useQuery(api.team.getCurrentUserId)
  const deactivateUser = useMutation(api.team.deactivateUser)
  const reactivateUser = useMutation(api.team.reactivateUser)

  const [editingUser, setEditingUser] = useState<{
    _id: Id<"users">
    email?: string
    firstName?: string
    lastName?: string
    role?: string
    isPeopleManager?: boolean | string
    teamLead?: string | null
    isActive?: boolean
  } | null>(null)

  const handleDeactivate = async (userId: Id<"users">, userName: string) => {
    try {
      await deactivateUser({ userId })
      toast.success(`${userName} has been deactivated`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to deactivate user")
    }
  }

  const handleReactivate = async (userId: Id<"users">, userName: string) => {
    try {
      await reactivateUser({ userId })
      toast.success(`${userName} has been reactivated`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reactivate user")
    }
  }

  // Loading state - wait for canAccessTeam to load first
  if (canAccessTeam === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    )
  }

  // Unauthorized state - user doesn't have access to team page
  if (!canAccessTeam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You are not authorized to view this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Only admins, ops admins, and people managers can access the team management page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state for remaining data (only after access is confirmed)
  if (isAdmin === undefined || users === undefined || currentUserId === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </div>
            {isAdmin && <CreateUserDialog />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>People Manager</TableHead>
                  <TableHead>Team Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdmin && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="h-24 text-center">
                      No team members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    // Determine role icon and color
                    const getRoleIcon = (role?: string) => {
                      const r = role?.toLowerCase()
                      if (r === 'admin') return { icon: IconShieldFilled, color: 'fill-purple-500 dark:fill-purple-400' }
                      if (r === 'ops admin') return { icon: IconShieldCheckFilled, color: 'fill-blue-500 dark:fill-blue-400' }
                      if (r === 'team lead') return { icon: IconUserFilled, color: 'fill-orange-500 dark:fill-orange-400' }
                      if (r === 'kyc analyst') return { icon: IconUserFilled, color: 'fill-green-500 dark:fill-green-400' }
                      if (r === 'qc analyst') return { icon: IconUserFilled, color: 'fill-teal-500 dark:fill-teal-400' }
                      return { icon: IconUserFilled, color: 'fill-gray-500 dark:fill-gray-400' }
                    }

                    const { icon: RoleIcon, color: roleColor } = getRoleIcon(user.role)
                    const isPeopleManagerActive = user.isPeopleManager === true ||
                                                  user.isPeopleManager === 'Yes' ||
                                                  user.isPeopleManager === 'yes'

                    return (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-muted-foreground gap-1.5 px-1.5">
                            <RoleIcon className={`size-3.5 ${roleColor}`} />
                            {user.role || 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1.5 px-1.5 ${isPeopleManagerActive ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                          >
                            <IconUserFilled className={`size-3.5 ${isPeopleManagerActive ? 'fill-indigo-500 dark:fill-indigo-400' : 'fill-gray-400 dark:fill-gray-500'}`} />
                            {isPeopleManagerActive ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.teamLead || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="gap-1.5 px-1.5 text-muted-foreground"
                          >
                            {(user.isActive ?? true) ? (
                              <>
                                <IconCircleCheckFilled className="size-3.5 fill-green-500 dark:fill-green-400" />
                                Active
                              </>
                            ) : (
                              <>
                                <IconCircleXFilled className="size-3.5 fill-red-500 dark:fill-red-400" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user._creationTime).toLocaleDateString()}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                                  size="icon"
                                >
                                  <IconDotsVertical />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                  Edit
                                </DropdownMenuItem>
                                {currentUserId !== user._id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {(user.isActive ?? true) ? (
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => handleDeactivate(user._id, user.name || `${user.firstName} ${user.lastName}`)}
                                      >
                                        Deactivate
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() => handleReactivate(user._id, user.name || `${user.firstName} ${user.lastName}`)}
                                      >
                                        Activate
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
            <div className="flex gap-6">
              <span>
                Total Users: <span className="font-medium text-foreground">{users.length}</span>
              </span>
              <span>
                Active: <span className="font-medium text-foreground">{users.filter(u => u.isActive ?? true).length}</span>
              </span>
              <span>
                Inactive: <span className="font-medium text-foreground">{users.filter(u => !(u.isActive ?? true)).length}</span>
              </span>
            </div>
            <div>
              <span>
                Admins: <span className="font-medium text-foreground">{users.filter(u => u.role?.toLowerCase() === 'admin').length}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          isEditingSelf={currentUserId === editingUser._id}
        />
      )}
    </div>
  )
}
