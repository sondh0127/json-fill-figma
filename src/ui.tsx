import {
  Button,
  Columns,
  Container,
  render,
  VerticalSpace,
  FileUploadButton,
  Disclosure,
  Banner,
  IconWarningFilled32,
  Textbox,
  DropdownOption,
  Dropdown
} from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useMemo } from 'preact/hooks'
import { setup } from 'twind/shim'
import { CloseHandler, SubmitHandler, SuccessHandler, LoadHandler, WarnHandler, SaveSettingsHandler, SETTING_DATA_KEY, LoadSettingsHandler } from './types'

setup({
  preflight: true,
  mode: 'silent',
  theme: {},
})

// UTILS
export function notNullish<T>(v: T | null | undefined): v is NonNullable<T> {
  return v != null
}

export function objectMap<K extends string, V, NK = K, NV = V>(obj: Record<K, V>, fn: (key: K, value: V) => [NK, NV] | undefined): Record<K, V> {
  return Object.fromEntries(
    Object.entries(obj)
      .map(([k, v]) => fn(k as K, v as V))
      .filter(notNullish),
  )
}
// UTILS

const MARK_MAPS: Record<string, (value: string) => string> = {
  'UNSET': (value: string) => value,
  'HIDE_PHONE_MARK': (value) => {
    return value.replace(value.substring(4, 7), 'XXX');
  }
}

function Plugin() {
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [dataEntries, setDataEntries] = useState<any[]>([])
  // APPPLY FOR EACH DATA ENTRY
  const [dataConfig, setDataConfig] = useState<{ key: string, suffix: string, mark?: 'HIDE_PHONE_MARK' | 'UNSET' }[]>([])

  const disabled = useMemo(() => dataEntries.length === 0, [dataEntries])

  on<LoadSettingsHandler>('LOAD_SETTINGS', (settingKey, settings) => {
    switch (settingKey) {
      case SETTING_DATA_KEY.DATA_CONFIG:
        setDataConfig(settings)
        break;
      default:
        break;
    }
  });

  const handleSelectedFiles = (files: Array<File>) => {
    if (files.length <= 0) {
      return false;
    }

    const fr = new FileReader();

    fr.onload = function (e) {
      if (!e.target) {
        return
      }
      try {
        let data = JSON.parse(e.target.result as string) as any[];
        // post data to ui
        emit<LoadHandler>('LOAD', { data })
        let errorCount = 0;

        if (data.length === undefined) {
          data = [data];
          emit<WarnHandler>('WARN', { type: 'NON_ARRAY' })
        }

        // iterate over data/json entries
        for (let entry of data) {

          // WARNING : if an object is empty
          let _errorEmpty = Object.keys(entry).length === 0;
          if (_errorEmpty && errorCount <= 0) {
            emit<WarnHandler>('WARN', { type: 'EMPTY_OBJECT' })
            errorCount++;
          }
        }

        if (!errorCount) {
          setDataEntries(data)
        }

        const dataKeys = JSON.stringify(Object.keys(data[0]))
        const configKeys = JSON.stringify(dataConfig.map(item => item.key))
        if (dataKeys !== configKeys) {
          setDataConfig(Object.keys(data[0]).map(key => {
            return {
              key: key,
              suffix: '',
              mark: 'UNSET'
            }
          }))
        }

        setErrorMsg('')
        emit<SuccessHandler>('SUCCESS')
      } catch (error) {
        if (error instanceof SyntaxError) {
          setErrorMsg('The file could not be loaded. The file seems to have syntax errors.')
        }
      }
    };

    fr.readAsText(files[0]);

  }


  const handleClose = () => {
    emit<CloseHandler>('CLOSE')
  }

  const handleSubmit = () => {
    const newDataEntries = dataEntries.map((item) => {
      return objectMap(item, (k, v) => {
        const entry = dataConfig.find(config => config.key === k)
        if (entry) {
          let newValue = `${v} ${entry.suffix}`.trim()
          if (entry.mark && entry.mark !== 'UNSET') {
            newValue = MARK_MAPS[entry.mark](newValue)
          }
          return [k, newValue]
        }

        return [k, v]
      })

    })
    emit<SubmitHandler>('SUBMIT', { data: newDataEntries })
    emit<SaveSettingsHandler>('SAVE_SETTINGS', SETTING_DATA_KEY.DATA_CONFIG, dataConfig)
  }

  const [isOpen, setIsOpen] = useState(false)
  function handleClick() {
    setIsOpen(!(isOpen === true))
  }

  const [isOpenConfig, setIsOpenConfig] = useState(false)
  function handleClickConfig() {
    setIsOpenConfig(!(isOpenConfig === true))
  }

  function handleMarkChange(event: Event, index: number) {
    // @ts-ignore
    const newValue = event.currentTarget.value
    setDataConfig((dataConfig) => {
      const newDataConfig = [...dataConfig]
      newDataConfig[index].mark = newValue
      return newDataConfig
    })
  }

  function handleInput(event: Event, index: number) {
    // @ts-ignore
    const newValue = event.currentTarget.value
    setDataConfig((dataConfig) => {
      const newDataConfig = [...dataConfig]
      newDataConfig[index].suffix = newValue
      return newDataConfig
    })
  }

  return (
    <Container>
      <VerticalSpace space="small" />

      <FileUploadButton onSelectedFiles={handleSelectedFiles} accept="application/json">
        Ch???n file
      </FileUploadButton>
      <VerticalSpace space="small" />
      {
        errorMsg && (
          <div>
            <Banner icon={<IconWarningFilled32 />} type="warning">
              {errorMsg}
            </Banner>
            <VerticalSpace space="small" />
          </div>
        )
      }

      <Disclosure isOpen={isOpen} onClick={handleClick} title="D??? li???u">
        <div className="max-h-[100px] overflow-y-auto">
          {
            dataEntries.map((entry, index) => {
              return (
                <pre className="">
                  {JSON.stringify(entry, null, 2)}
                </pre>
              )
            })
          }
        </div>

      </Disclosure>
      <Disclosure isOpen={isOpenConfig} onClick={handleClickConfig} title="C???u h??nh">
        {
          dataConfig.map((config, index) => {
            return (
              <div key={index} className="border-b-gray-500 mb-1">
                <div className="font-medium text-[12px] text-blue-500">{config.key}:</div>
                <div className="">
                  {
                    Object.entries(config).map(([key, value], _idx) => {
                      if (key === 'key') return null

                      const input = () => {
                        if (key === 'suffix') {
                          return (
                            <Textbox onInput={(event) => handleInput(event, index)} value={value} />
                          )
                        }
                        if (key === 'mark') {
                          const options: Array<DropdownOption> = [
                            ...Object.keys(MARK_MAPS).map(key => ({ value: key }))
                          ]
                          return (
                            <Dropdown onChange={(event) => handleMarkChange(event, index)} options={options} value={value} />
                          )
                        }
                      }

                      return (
                        <div className="flex" key={_idx}>
                          <div className="flex space-x-2 items-center">
                            <div className="w-[40px] font-medium"> {key} </div>
                            {input()}
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            )
          })
        }
      </Disclosure>

      <VerticalSpace space="small" />

      <Columns space="extraSmall">
        <Button disabled={disabled} fullWidth onClick={handleSubmit}>
          Nh???p
        </Button>
        <Button disabled={disabled} fullWidth onClick={handleClose} secondary>
          ????ng
        </Button>
      </Columns>
      <VerticalSpace space="small" />
    </Container>
  )
}

export default render(Plugin)
