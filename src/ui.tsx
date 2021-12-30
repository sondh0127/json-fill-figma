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
import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useState, useMemo } from 'preact/hooks'
import { setup } from 'twind/shim'
import { CloseHandler, SubmitHandler, SuccessHandler, LoadHandler, WarnHandler } from './types'

setup({
  preflight: true,
  theme: {},
})


const MARK_MAPS: Record<string, (value: string) => string> = {
  'UNSET': (value: string) => value,
  'HIDE_PHONE_MARK': (value) => {
    return value.split('').splice(3, 3, 'X').join('')
  }
}

function Plugin() {
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [dataEntries, setDataEntries] = useState<any[]>([])
  const [dataConfig , setDataConfig] = useState<{key: string, suffix: string, mark?: 'HIDE_PHONE_MARK' | 'UNSET'}[]>([])

  const disabled = useMemo(() => dataEntries.length === 0, [dataEntries])

  function acceptAndSendData(data: any) {
    // post data to ui
    emit<LoadHandler>('LOAD', { data })

    // creates for each entry a direct link in list
    let i = 0;
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

      if (!_errorEmpty) {
        setDataEntries(data)

        setDataConfig(Object.keys(data[0]).map(key => {
          return {
            key: key,
            suffix: '',
            mark: 'UNSET'
          }
        }))
      }
    }
    setErrorMsg('')
    emit<SuccessHandler>('SUCCESS')
  }


  const handleSelectedFiles = useCallback((files: Array<File>) => {
    if (files.length <= 0) {
      return false;
    }

    const fr = new FileReader();

    fr.onload = function (e) {
      if (!e.target) {
        return
      }
      try {
        const data = JSON.parse(e.target.result as string);
        acceptAndSendData(data);
      } catch (error) {
        if (error instanceof SyntaxError) {
          setErrorMsg('The file could not be loaded. The file seems to have syntax errors.')
        }
      }
    };

    fr.readAsText(files[0]);

  }, [])


  const handleClose = useCallback(() => {
    emit<CloseHandler>('CLOSE')
  }, [])

  const handleSubmit = useCallback(() => {
    emit<SubmitHandler>('SUBMIT')
  }, [])

  const [isOpen, setIsOpen] = useState(false)
  function handleClick() {
    setIsOpen(!(isOpen === true))
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
        Chọn file
      </FileUploadButton>

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

      <Disclosure isOpen={isOpen} onClick={handleClick} title="Dữ liệu">
        {
          dataEntries.map((entry, index) => {
            return (
              <pre>
                {JSON.stringify(entry, null, 2)}
              </pre>
            )
          })
        }
      </Disclosure>

      {
        dataConfig.map((config, index) => {
          return (
            <div key={index} className="border border-b-gray-500 bg-red-200">
              <div className="font-medium text-[16px]">{ config.key }</div>
              {
                Object.entries(config).map(([key, value], _idx) => {

                  if (key === 'suffix') {
                    return (
                      <div className="flex" key={_idx}>
                        <div className="flex space-x-2 items-center">
                          <div className="w-[80px] font-medium"> { key } </div>
                          <Textbox onInput={(event) => handleInput(event, index)} value={value} />
                        </div>
                      </div>
                    )
                  }

                  if (key === 'mark') {
                    const options: Array<DropdownOption> = [
                      ...Object.keys(MARK_MAPS).map(key => ({ value: key }))
                    ]
                    return (
                      <div className="flex" key={_idx}>
                        <div className="flex space-x-2 items-center">
                          <div className="w-[80px] font-medium"> { key } </div>
                          <Dropdown onChange={(event) => handleMarkChange(event, index)} options={options} value={value} />
                        </div>
                      </div>
                    )
                  }
                  return null
                })
              }
            </div>
          )
        })
      }
      <VerticalSpace space="small" />

      <Columns space="extraSmall">
        <Button disabled={disabled} fullWidth onClick={handleSubmit}>
          Nhập
        </Button>
        <Button disabled={disabled} fullWidth onClick={handleClose} secondary>
          Đóng
        </Button>
      </Columns>
      <VerticalSpace space="small" />
    </Container>
  )
}

export default render(Plugin)
