export interface ISettings {
  area: boolean
  iteration: boolean
  tags: boolean
}

const INIT_SETTINGS: ISettings = {
  area: false,
  iteration: false,
  tags: false,
}

export const initSettings = (settings?: { [k: string]: any }): ISettings => {
  if (!settings) return { ...INIT_SETTINGS }

  return Object.keys(INIT_SETTINGS)
    .reduce((acc: ISettings, curKey: string) => {
      if (settings.hasOwnProperty(curKey)) acc[curKey as keyof ISettings] = settings[curKey] as boolean
      return acc
    }, { ...INIT_SETTINGS })
}