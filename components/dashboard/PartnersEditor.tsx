"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Trash2, Edit } from "lucide-react"

interface Partner {
  id: number
  name: string
  name_short: string
  order_index: number
}

export function PartnersEditor() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPartners()
  }, [])

  const loadPartners = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/content/partners")
      if (response.ok) {
        const json = (await response.json()) as { data?: Partner[] }
        setPartners(json.data ?? [])
      }
    } catch (error) {
      toast.error("Failed to load partners")
    } finally {
      setLoading(false)
    }
  }

  const getToken = () => {
    return document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]
  }

  const handleSave = async (partner: Partial<Partner>) => {
    try {
      const token = getToken()
      const url = "/api/content/partners"
      const method = editingPartner ? "PUT" : "POST"
      const body = editingPartner ? { ...partner, id: editingPartner.id } : partner

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(editingPartner ? "Partner updated" : "Partner created")
        setIsDialogOpen(false)
        setEditingPartner(null)
        loadPartners()
      } else {
        toast.error("Failed to save partner")
      }
    } catch (error) {
      toast.error("Failed to save partner")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this partner?")) return

    try {
      const token = getToken()
      const response = await fetch(`/api/content/partners?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success("Partner deleted")
        loadPartners()
      } else {
        toast.error("Failed to delete partner")
      }
    } catch (error) {
      toast.error("Failed to delete partner")
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Partners</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPartner(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPartner ? "Edit Partner" : "Add Partner"}</DialogTitle>
            </DialogHeader>
            <PartnerForm
              partner={editingPartner}
              onSave={handleSave}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingPartner(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {partners.map((partner) => (
              <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-semibold">{partner.name}</div>
                  <div className="text-sm text-muted-foreground">Short: {partner.name_short}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPartner(partner)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(partner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {partners.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No partners yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PartnerForm({
  partner,
  onSave,
  onCancel,
}: {
  partner: Partner | null
  onSave: (partner: Partial<Partner>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: partner?.name || "",
    name_short: partner?.name_short || "",
    order_index: partner?.order_index || 0,
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(formData)
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Short Name</Label>
        <Input
          value={formData.name_short}
          onChange={(e) => setFormData({ ...formData, name_short: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Order Index</Label>
        <Input
          type="number"
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отменить
        </Button>
        <Button type="submit">Сохранить</Button>
      </div>
    </form>
  )
}
