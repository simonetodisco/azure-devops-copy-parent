import { IProjectInfo, IProjectPageService, CommonServiceIds } from 'azure-devops-extension-api'
import * as SDK from 'azure-devops-extension-sdk'
import { getService } from 'azure-devops-extension-sdk'

export async function getProject (): Promise<IProjectInfo | undefined> {
  await SDK.ready()
  const projectDataService = await getService<IProjectPageService>(CommonServiceIds.ProjectPageService)
  const project = await projectDataService.getProject()

  return project
}
