import { z } from "zod"
import { allZodSchemas, SharedDefaultResponse } from "@/lib/types"

export const LoginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const LoginResponse = SharedDefaultResponse.extend({
  data: z.object({
    token: z.string(),
    user: z.object({ username: z.string(), id: z.number() }),
  }),
})

export type LoginBody = z.infer<typeof LoginBody>
export type LoginResponse = z.infer<typeof LoginResponse>
