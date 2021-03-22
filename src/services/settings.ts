import { IExtensionDataManager } from 'azure-devops-extension-api'
import { ISettings, initSettings } from '../models/settings'
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

    try {
      await this.manager?.createDocument(COPY_PARENT_SETTINGS, { ...initSettings(), id: this.projectId })
    } catch (e) {
      // in case of failure it means the settings document was already created
      console.error(e)
    }

    this.initialized = true
  }

  async setSettings (settings: ISettings) {
    if (!this.initialized) throw this.getInitException()

    await this.manager?.setDocument(
      COPY_PARENT_SETTINGS,
      { ...settings, id: this.projectId, __etag: -1 }
    )

    return settings
  }

  async getSettings () {
    if (!this.initialized || !this.projectId) throw this.getInitException()

    const settings: ISettings = await this.manager?.getDocument(COPY_PARENT_SETTINGS, this.projectId)
    return { ...initSettings(settings) }
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