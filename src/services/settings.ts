import { IExtensionDataManager } from 'azure-devops-extension-api'
import { ISettings, getEmptySettings } from '../models/settings'
import { getStorageManager } from './storage'
import { getProject } from './project'

const COPY_PARENT_SETTINGS = 'CopyParentSettings'

export interface ISettingsService {
  init(): Promise<void>
  setSettings(settings: ISettings): Promise<ISettings>
  getSettings(): Promise<ISettings>
}

export class SettingsService implements ISettingsService {
  private initialized: boolean = false
  private manager: IExtensionDataManager | undefined
  private projectId: string | undefined

  public async init () {
    await Promise.all([
      this.getProjectId(),
      this.getManager(),
    ]);

    await this.manager?.createDocument(COPY_PARENT_SETTINGS, { id: this.projectId, ...getEmptySettings() })

    this.initialized = true
  }

  async setSettings (settings: ISettings) {
    if (!this.initialized) throw this.getInitException()

    await this.manager?.setDocument(
      COPY_PARENT_SETTINGS,
      { id: this.projectId, ...settings }
    )

    return settings
  }

  async getSettings () {
    if (!this.initialized || !this.projectId) throw this.getInitException()

    const project = await this.manager?.getDocument(COPY_PARENT_SETTINGS, this.projectId)
    return project
  }

  private async getProjectId () {
    if (this.projectId) return this.projectId

    this.projectId = (await getProject())?.id
  }

  private async getManager () {
    if (this.manager) return this.manager

    this.manager = await getStorageManager()
  }

  private getInitException () {
    return new Error('To use the storage class it is necessary to call the init() method.')
  }
}