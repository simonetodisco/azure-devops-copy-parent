export interface ISettings {
  area: boolean
  iteration: boolean
  tags: boolean
}

export const getEmptySettings = (): ISettings => ({
  area: false,
  iteration: false,
  tags: false,
})