import * as SDK from 'azure-devops-extension-sdk'
import { getClient } from 'azure-devops-extension-api'
import { WorkItemTrackingRestClient, WorkItem } from 'azure-devops-extension-api/WorkItemTracking'
import { SettingsService } from '../../services/settings'

const register = async () => {
  await SDK.init()

  let idToParent: { [key: number]: { parentId: number, alreadyUpdated: boolean } } = {}
  SDK.register(SDK.getContributionId(), () => {
    return {
      // Called when the active work item is modified
      onFieldChanged: async (args: any) => {
        const curChildId = parseInt(args.id)
        const curParentId = args.changedFields['System.Parent']
        const curIdToParent = idToParent[curChildId]

        if (curChildId && curParentId && (!curIdToParent || curIdToParent.parentId !== curParentId)) {
          idToParent[curChildId] = {
            parentId: curParentId,
            alreadyUpdated: false,
          }
        }
      },

      // Called after the work item has been saved
      onSaved: async (args: any) => {
        const childId = args.id
        const { parentId, alreadyUpdated } = idToParent[childId]

        if (!childId || !parentId || alreadyUpdated) return

        const settingsService = new SettingsService()
        await settingsService.init()

        const settings = await settingsService.getSettings()

        // check if at least one setting is true, otherwise will return
        if (!Object.values(settings).some((s: boolean) => s)) return

        const clt = getClient(WorkItemTrackingRestClient)

        // creating an object, work item id => work item
        const workItems: { [key: number]: WorkItem } = (await clt.getWorkItems(
          [childId, parentId],
          undefined,
          ['System.TeamProject', 'System.AreaPath', 'System.IterationPath', 'System.Tags', 'System.Parent']
        )).reduce(
          (acc: { [key: number]: any }, cur) => {
            acc[cur.id] = cur
            return acc
          },
          {}
        )

        const childWi = workItems[childId]
        const parentWi = workItems[parentId]

        // copy items just if child was not already updated and bot work item's project is the same
        if (childWi.fields['System.TeamProject'] === parentWi.fields['System.TeamProject']) {
          const payload = []
          if (settings.area) {
            payload.push({
              op: 'add',
              path: '/fields/System.AreaPath',
              value: parentWi.fields['System.AreaPath'],
            })
          }

          if (settings.iteration) {
            payload.push({
              op: 'add',
              path: '/fields/System.IterationPath',
              value: parentWi.fields['System.IterationPath'],
            })
          }

          if (settings.tags) {
            payload.push({
              from: null,
              op: 'add',
              path: '/fields/System.Tags',
              value: [
                ...new Set([
                  ...getTags(childWi.fields['System.Tags']),
                  ...getTags(parentWi.fields['System.Tags']),
                ])
              ].join(','),
            })
          }

          if (payload.length) await clt.updateWorkItem(payload, childId)
        }

        idToParent[childId].alreadyUpdated = true

        /**
          * This logic prevents an issue when a child is created from the parent work item. In this situation, also the
          * parent triggers an onFieldChanged update, because the number of links is increased. Unfortunately even if
          * it's not modified, the parent of the parent (grandparent) is included in the list of modified fields.
        */
        const grandParentId = parentWi.fields['System.Parent']
        if (grandParentId) {
          const curParentToGrandParent = idToParent[parentId]
          if (curParentToGrandParent && curParentToGrandParent.parentId === grandParentId) {
            idToParent[parentId].alreadyUpdated = true
          } else {
            idToParent[parentId] = {
              parentId: grandParentId,
              alreadyUpdated: true,
            }
          }
        }
      },
    }
  })
}

const getTags = (tags?: string) => {
  if (!tags) return []
  return tags.split(';')
}

register()
