import type { BaseTranslation } from '../i18n-base';

const en = {
  CommonWords: {
    Continue: 'Continue',
    Update: 'Update',
  },
  FormLocalRegister: {
    Label: 'Public name',
    Placeholder: 'ex: Daniel P. Becerra',
    Desc: 'How others will see you',
    Hint: 'You can change it later',
  },
  Dashboard: {
    PageEmitter: {
      Title: 'Call',
      MainButton: 'Help!',
      ListenersLabel: 'People waiting you:',
      EnableDetectionCheckbox: 'Allow others to detect this device',
    },
    PageReceiver: {
      Title: 'Lists',
      SelectedDevicesTab: {
        Title: 'Known devices',
        EmptyPlaceholder: 'No known devices',
      },
      SearchDevicesTab: {
        Title: 'Discover',
        DetectButton: 'Detect devices',
        EmptyPlaceholder: 'No devices nearby',
      },
    },
    PageSettings: {
      Title: 'Settings',
      FormLocalName: {
        Label: 'Current name',
        Hint: "Changes will be reflected on other people's devices.",
      },
    },
  },
} satisfies BaseTranslation;

export default en;
