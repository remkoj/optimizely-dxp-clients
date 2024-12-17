import type { NextRequest, NextResponse } from 'next/server'
import type { cookies  } from "next/headers"
import { v4 as createGuid } from 'uuid'
import getConfig from '../config'

export function getOrCreateVisitorId(request: NextRequest) : string
{
    return request.cookies.get(getConfig().FrontendCookie)?.value ?? createGuid().replaceAll('-','')
}

export function getVisitorId(c: ReturnType<typeof cookies>) : string | undefined
{
    return c.get(getConfig().FrontendCookie)?.value
}

export function addVisitorId<T = unknown>(response: NextResponse<T>, visitorId: string) : NextResponse<T>
{
    const DEBUG = getConfig().RuntimeEnv == 'development'
    response.cookies.set({
        name: 'visitorId',
        value: visitorId,
        sameSite: "strict",
        path: "/",
        secure: !DEBUG
    })
    return response
}

export default {
    getVisitorId,
    getOrCreateVisitorId,
    addVisitorId
}