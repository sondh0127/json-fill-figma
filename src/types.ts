import { EventHandler } from '@create-figma-plugin/utilities'

export interface SubmitHandler extends EventHandler {
  name: 'SUBMIT'
  handler: (payload: { data: any[] }) => void
}

export interface CloseHandler extends EventHandler {
  name: 'CLOSE'
  handler: () => void
}

export interface SuccessHandler extends EventHandler {
  name: 'SUCCESS',
  handler: () => void
}

export interface LoadHandler extends EventHandler {
  name: 'LOAD',
  handler: (payload: { data: any[] }) => void
}

export interface WarnHandler extends EventHandler {
  name: 'WARN',
  handler: (payload: { type: 'EMPTY_OBJECT' | 'NON_ARRAY' }) => void
}

export enum SETTING_DATA_KEY {
  DATA_CONFIG = '__DATA_CONFIG__'
}

export interface SaveSettingsHandler extends EventHandler {
  name: 'SAVE_SETTINGS',
  handler: (settingKey: SETTING_DATA_KEY, settings: Record<string, any>) => void
}

export interface LoadSettingsHandler extends EventHandler {
  name: 'LOAD_SETTINGS',
  handler: (settingKey: SETTING_DATA_KEY, settings: any) => void
}
