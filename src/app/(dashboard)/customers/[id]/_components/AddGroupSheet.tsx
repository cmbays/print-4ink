'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@shared/ui/primitives/sheet'
import { Button } from '@shared/ui/primitives/button'
import { Input } from '@shared/ui/primitives/input'
import { Label } from '@shared/ui/primitives/label'

type AddGroupSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddGroupSheet({ open, onOpenChange }: AddGroupSheetProps) {
  const [groupName, setGroupName] = useState('')

  function handleCreate() {
    // Phase 1: No actual save
    console.log('Group created', { name: groupName })
    setGroupName('')
    onOpenChange(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setGroupName('')
    onOpenChange(nextOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Create Group</SheetTitle>
          <SheetDescription>Create a new group to organize contacts.</SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">
              Group Name <span className="text-error">*</span>
            </Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Front Office, Warehouse"
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!groupName.trim()}>
            Create Group
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
