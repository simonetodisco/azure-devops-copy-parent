import './hub.scss'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as SDK from 'azure-devops-extension-sdk'
import { CommonServiceIds, IExtensionDataService, IExtensionDataManager } from 'azure-devops-extension-api'
import { Header, TitleSize } from 'azure-devops-ui/Header'
import { Page } from 'azure-devops-ui/Page'
import { Checkbox } from 'azure-devops-ui/Checkbox'
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner'

interface State {
  settings: Settings
  cmpReady: boolean
}

const settingLabels: {[key in keyof Settings]: string} = {
  area: 'Area',
  iteration: 'Iteration',
  tags: 'Tags',
}

class Hub extends React.Component<{}, State> {
  private _dataManager?: IExtensionDataManager

  constructor(props: {}) {
    super(props)
    this.state = {
      settings: {
        area: false,
        iteration: false,
        tags: false,
      },
      cmpReady: false,
    }
  }

  public async componentDidMount() {
    await SDK.init()
    await SDK.ready()
    const accessToken = await SDK.getAccessToken()
    const extDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService)

    this._dataManager = await extDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken)

    const settings: Settings = await this._dataManager.getValue('settings')
    console.log(settings)
    this.setState({
      settings,
      cmpReady: true,
    })
  }

  private async onSettingChange (
    event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    value: boolean,
    id: keyof Settings
  ) {
    if (this._dataManager) {
      const settings = {
        ...this.state.settings,
        [id]: value
      }

      await this._dataManager.setValue('settings', settings)

      this.setState({
        settings: {
          ...settings,
        }
      })
    } else {
      console.error('State not saved')
    }
  }

  public render(): JSX.Element {
    if (!this.state.cmpReady) return (
      <Page className="flex-grow">
        <div className="page-content page-content-top">
          <Spinner size={SpinnerSize.large} />
        </div>
      </Page>
    )

    return (
      <Page className="flex-grow">
        <Header title="Copy Parent" titleSize={TitleSize.Large} />
        <div className="page-content">
          Select the fields you want to copy from the work item's parent. The updates will happen just if the changes are made through the UI.
        </div>
        <div className="page-content flex-column">
          {Object.keys(this.state.settings).map((k: string) => <Checkbox
            key={k}
            id={k}
            label={settingLabels[k as keyof Settings]}
            checked={this.state.settings[k as keyof Settings]}
            onChange={(event, value) => this.onSettingChange(event, value, k as keyof Settings)}
          />)}
        </div>
      </Page>
    )
  }
}

ReactDOM.render(<Hub />, document.getElementById('root'))
