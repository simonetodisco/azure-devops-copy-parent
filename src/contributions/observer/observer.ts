import * as SDK from 'azure-devops-extension-sdk'
import { getClient } from 'azure-devops-extension-api'
import { WorkItemTrackingRestClient, WorkItem } from 'azure-devops-extension-api/WorkItemTracking'
import { SettingsService } from '../../services/settings'

const register = async () => {
  await SDK.init()

  let idToParent: { [key: number]: { parentId: number, updated: boolean} } = {}
  SDK.register(SDK.getContributionId(), () => {
    return {
      // Called when the active work item is modified
      onFieldChanged: async (args: any) => {
        const wiId = parseInt(args.id)
        const parentId = args.changedFields['System.Parent']

        if (parentId === null) {
          delete idToParent[wiId]
        } else if (
          wiId !== 0 &&
          (
            (!isNaN(parentId) && !idToParent[wiId]) ||
            (parentId && idToParent[wiId].parentId !== parentId)
          )
        ) {
          idToParent[wiId] = {
            parentId: parentId,
            updated: false
          }
        }
      },

      // Called after the work item has been saved
      onSaved: async (args: any) => {
        // if not items have to be update or were all updated, return
        if (!Object.keys(idToParent).length || Object.values(idToParent).some(i => i.updated)) return

        const settingsService = new SettingsService()
        await settingsService.init()

        const settings = await settingsService.getSettings()

        // check if at least one setting is true, otherwise will return
        if (!Object.values(settings).some((s: boolean) => s)) return

        // collecting all workitems to be updated (child and its parent) in a unique variable
        const workItemIds = (Object.keys(idToParent) as unknown as number[])
          .reduce((acc: number[], k: number) => {
            if (!idToParent[k].updated) return [...new Set([...acc, k, idToParent[k].parentId])]
            return acc
          }, [])

        const clt = getClient(WorkItemTrackingRestClient)

        // creating an object, work item id => work item
        const workItems: { [key: number]: WorkItem } = (await clt.getWorkItems(workItemIds))
          .reduce((acc: { [key: number]: any }, cur) => {
            acc[cur.id] = cur
            return acc
          }, {})

        const wiToUpdate = []
        for (const id in idToParent) {
          const wiId = id as unknown as number
          const parentId = idToParent[wiId].parentId

          const child = workItems[wiId]
          const parent = workItems[parentId]

          // copy items just if child was not already updated and bot work item's project is the same
          if (!idToParent[wiId].updated && child.fields['System.TeamProject'] === parent.fields['System.TeamProject']) {
            const payload = []
            if (settings.area) {
              payload.push({
                op: 'add',
                path: '/fields/System.AreaPath',
                value: parent.fields['System.AreaPath'],
              })
            }

            if (settings.iteration) {
              payload.push({
                op: 'add',
                path: '/fields/System.IterationPath',
                value: parent.fields['System.IterationPath'],
              })
            }

            if (settings.tags) {
              payload.push({
                from: null,
                op: 'add',
                path: '/fields/System.Tags',
                value: [
                  ...new Set([
                    ...getTags(child.fields['System.Tags']),
                    ...getTags(parent.fields['System.Tags']),
                  ])
                ].join(','),
              })
            }

            if (payload.length) wiToUpdate.push(clt.updateWorkItem(payload, wiId))
            idToParent[wiId].updated = true
          }
        }

        if (wiToUpdate.length) await Promise.all(wiToUpdate)
      },

      // Called when the work item is reset to its unmodified state (undo)
      onReset: (args: any) => {},

      // Called when the work item has been refreshed from the server
      onRefreshed: (args: any) => {}
    }
  })
}

const getTags = (tags?: string) => {
  if (!tags) return []
  return tags.split(';')
}

register()
