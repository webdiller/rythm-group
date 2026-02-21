"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface Contact {
  id: number
  email: string
  telegram_url: string
  telegram_username: string
}

export function ContactsEditor() {
  const [contact, setContact] = useState<Contact>({
    id: 1,
    email: "",
    telegram_url: "",
    telegram_username: "",
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadContact()
  }, [])

  const loadContact = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/content/contacts")
      if (response.ok) {
        const data = await response.json()
        setContact(data)
      }
    } catch (error) {
      toast.error("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

      const response = await fetch("/api/content/contacts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(contact),
      })

      if (response.ok) {
        toast.success("Contacts updated")
      } else {
        toast.error("Failed to save contacts")
      }
    } catch (error) {
      toast.error("Failed to save contacts")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Contacts</h2>
      <Card>
        <CardHeader>
          <CardTitle>Edit Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram_url">Telegram URL</Label>
            <Input
              id="telegram_url"
              type="url"
              value={contact.telegram_url}
              onChange={(e) => setContact({ ...contact, telegram_url: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram_username">Telegram Username</Label>
            <Input
              id="telegram_username"
              value={contact.telegram_username}
              onChange={(e) => setContact({ ...contact, telegram_username: e.target.value })}
              placeholder="@username"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
