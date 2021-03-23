import './hub.scss'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as SDK from 'azure-devops-extension-sdk'
import { Header, TitleSize } from 'azure-devops-ui/Header'
import { Page } from 'azure-devops-ui/Page'
import { Checkbox } from 'azure-devops-ui/Checkbox'
import { Button } from 'azure-devops-ui/Button'
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner'
import { SettingsService, ISettingsService } from '../../services/settings'
import { ISettings, initSettings } from '../../models/settings'

interface State {
  settings: ISettings
  cmpReady: boolean
  saveEnabled: boolean
}

const settingLabels: {[key in keyof ISettings]: string} = {
  area: 'Area',
  iteration: 'Iteration',
  tags: 'Tags',
}

class Hub extends React.Component<{}, State> {
  private _settingsService?: ISettingsService

  constructor(props: {}) {
    super(props)
    this.state = {
      settings: { ...initSettings() },
      cmpReady: false,
      saveEnabled: false,
    }
  }

  public async componentDidMount() {
    await SDK.init()

    this._settingsService = new SettingsService()
    await this._settingsService.init()

    const settings = await this._settingsService.getSettings()
    this.setState({
      settings: { ...settings },
      cmpReady: true,
    })
  }

  private async onSettingChange (
    event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    value: boolean,
    id: keyof ISettings
  ) {
    const settingsToUpdate = {
      ...this.state.settings,
      [id]: value
    }

    if (settingsToUpdate.iteration) settingsToUpdate.area = true
    this.setState({
      settings: {
        ...settingsToUpdate,
      },
      saveEnabled: true,
    })
  }

  async onSaveHandler () {
    if (this._settingsService) {
      const updatedSettings = await this._settingsService.setSettings(this.state.settings)

      this.setState({
        settings: { ...updatedSettings },
        saveEnabled: false,
      })
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
          <div>
            Select the fields you want to copy from the work item's parent. The updates will happen just if the changes are made through the UI.
          </div>
          <div className="hub-margin-vertical flex-column">
            {Object.keys(this.state.settings).map((k: string) => <Checkbox
              key={k}
              id={k}
              label={settingLabels[k as keyof ISettings]}
              checked={this.state.settings[k as keyof ISettings]}
              onChange={(event, value) => this.onSettingChange(event, value, k as keyof ISettings)}
              disabled={k === 'area' && this.state.settings.iteration}
            />)}
          </div>
          <div>
            <Button
              text="Save"
              primary={true}
              onClick={() => this.onSaveHandler()}
              disabled={!this.state.saveEnabled}
            />
          </div>
        </div>
      </Page>
    )
  }
}

ReactDOM.render(<Hub />, document.getElementById('root'))
