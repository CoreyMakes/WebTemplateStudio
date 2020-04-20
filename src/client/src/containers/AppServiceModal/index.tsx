import * as React from "react";
import { connect, useSelector, useDispatch } from "react-redux";
import asModal from "../../components/Modal";
import messages from "./messages";
import { ReactComponent as Cancel } from "../../assets/cancel.svg";
import { isAppServiceModalOpenSelector } from "../../store/navigation/modals/selector";
import RuntimeStackInfo from "./RuntimeStackInfo";
import AppServicePlanInfo from "./AppServicePlanInfo";
import AppNameEditor from "./AppNameEditor";
import SubscriptionSelection from "../../components/SubscriptionSelection";
import { InjectedIntlProps, injectIntl } from "react-intl";
import buttonStyles from "../../css/buttonStyles.module.css";
import { WIZARD_CONTENT_INTERNAL_NAMES, KEY_EVENTS, AZURE, EXTENSION_COMMANDS, SERVICE_KEYS, AzureResourceType } from "../../utils/constants";
import styles from "./styles.module.css";
import { AppState } from "../../store/combineReducers";
import { ISelectedAppService } from "../../store/azureProfileData/appService/model";
import { getAppServiceSelectionSelector } from "../../store/azureProfileData/appService/selector";
import classNames from "classnames";
import { useState } from "react";
import { saveAppServiceSettingsAction } from "../../store/azureProfileData/appService/action";
import { closeModalAction } from "../../store/navigation/modals/action";
import { sendTelemetry } from "../../utils/extensionService/extensionService";
import LocationSelection from "../../components/LocationSelection";
import { ReactComponent as ArrowDown } from "../../assets/chevron.svg";
import { AppContext } from "../../AppContext";
import ResourceGroupSelection from "../../components/ResourceGroupSelection";

interface IStateProps {
  isModalOpen: boolean;
}

type Props = IStateProps & InjectedIntlProps;

const AppServiceModal = ({ intl }: Props) => {
  const { formatMessage } = intl;
  const dispatch = useDispatch();
  const { vscode } = React.useContext(AppContext);
  const appServiceInStore = useSelector((state: AppState) => getAppServiceSelectionSelector(state));
  const initialSubscription = appServiceInStore ? appServiceInStore.subscription : "";
  const initialAppServiceName = appServiceInStore ? appServiceInStore.siteName : "";
  const initialLocation = appServiceInStore ? appServiceInStore.location : AZURE.DEFAULT_LOCATION;
  const initialResourceGroup = appServiceInStore ? appServiceInStore.resourceGroup : AZURE.DEFAULT_RESOURCE_GROUP;
  
  const [subscription, setSubscription] = useState(initialSubscription);
  const [appName, setAppName] = useState(initialAppServiceName);
  const [location, setLocation] = useState(initialLocation);
  const [resourceGroup, setResourceGroup] = useState(initialResourceGroup);
  const [isAvailableAppName, setIsAvailableAppName] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  React.useEffect(() => {
    if(showAdvanced) {      
      const azureServiceType = SERVICE_KEYS.APP_SERVICE;
      sendTelemetry(vscode, EXTENSION_COMMANDS.TRACK_OPEN_AZURE_SERVICE_ADVANCED_MODE, {azureServiceType});
    }
  }, [showAdvanced]);

  const isEnableSaveButton = (): boolean => {
    const isSubscriptionEmpty = subscription === "";
    const isAppNameEmpty = appName === "";
    const isLocationEmpty = location === "";

    return !(isSubscriptionEmpty || isAppNameEmpty || isLocationEmpty || !isAvailableAppName);
  };

  const getButtonClassNames = () => {
    const buttonClass = isEnableSaveButton() ? buttonStyles.buttonHighlighted : buttonStyles.buttonDark;
    return classNames(buttonClass, styles.button);
  };

  const closeModalIfPressEnterOrSpaceKey = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (event.key === KEY_EVENTS.ENTER || event.key === KEY_EVENTS.SPACE) {
      event.preventDefault();
      event.stopPropagation();
      dispatch(closeModalAction());
    }
  };

  const saveAppServiceSelection = (): void => {
    const appServiceSelection: ISelectedAppService = {
      subscription,
      resourceGroup,
      location,
      siteName: appName,
      internalName: WIZARD_CONTENT_INTERNAL_NAMES.APP_SERVICE,
    };
    dispatch(saveAppServiceSettingsAction(appServiceSelection));
  };

  return (
    <React.Fragment>
      <div className={styles.header}>
        <div className={styles.title}>{formatMessage(messages.title)}</div>
        <Cancel
          data-testid="close-button"
          className={styles.closeIcon}
          onClick={() => dispatch(closeModalAction())}
          onKeyDown={closeModalIfPressEnterOrSpaceKey}
        />
      </div>
      <div className={styles.body}>
        <SubscriptionSelection
          initialSubscription={subscription}
          onSubscriptionChange={setSubscription} />

        <AppNameEditor
          subscription={subscription}
          appName={appName}
          onAppNameChange={setAppName}
          onIsAvailableAppNameChange={setIsAvailableAppName}
        />

        <AppServicePlanInfo subscription={subscription} />
        <RuntimeStackInfo />

        {/* Advanced Mode */}
        <div className={classNames({ [styles.hide]: !showAdvanced })} >
          <LocationSelection
            location={location}
            subscription={subscription}
            azureServiceType={AzureResourceType.AppService}
            onLocationChange={setLocation} />
          <ResourceGroupSelection
            subscription={subscription}
            resourceGroup={resourceGroup}
            onResourceGroupChange={setResourceGroup} />
        </div>
      </div>
      <div className={styles.footer}>
          <button
            className={classNames(buttonStyles.buttonLink, styles.showAdvancedModeLink)}
            onClick={() => setShowAdvanced(!showAdvanced)}>
              {formatMessage(showAdvanced ? messages.hideAdvancedMode : messages.showAdvancedMode)}
              <ArrowDown className={classNames(styles.advancedModeIcon, {[styles.rotateAdvancedModeIcon]: !showAdvanced})} />
          </button>

          <button className={getButtonClassNames()} onClick={saveAppServiceSelection} disabled={!isEnableSaveButton()}>
            {formatMessage(messages.save)}
          </button>
        </div>
    </React.Fragment>
  );
};

const mapStateToProps = (state: AppState): IStateProps => ({
  isModalOpen: isAppServiceModalOpenSelector(state),
});

export default connect(mapStateToProps)(asModal(injectIntl(AppServiceModal)));
