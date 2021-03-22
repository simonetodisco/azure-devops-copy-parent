import { IExtensionDataManager, IExtensionDataService, CommonServiceIds } from 'azure-devops-extension-api'
import * as SDK from 'azure-devops-extension-sdk'
import { getAccessToken, getExtensionContext, getService } from 'azure-devops-extension-sdk'

export async function getStorageManager (): Promise<IExtensionDataManager> {
  await SDK.ready()
  const context = getExtensionContext()
  const extensionDataService = await getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService)
  const accessToken = await getAccessToken()

  return extensionDataService.getExtensionDataManager(context.id, accessToken)
}
