import classnames from "classnames";
import * as React from "react";
import buttonStyles from "../../css/buttonStyles.module.css";
import styles from "./styles.module.css";
import { KEY_EVENTS } from "../../utils/constants/constants";
import { ROUTES } from "../../utils/constants/routes";

import { IVSCodeObject } from "../../types/vscode";

import { openGenModalAction } from "../../store/navigation/modals/action";

import { InjectedIntlProps, injectIntl } from "react-intl";

import { isEnableNextPageSelector, isEnableGenerateButtonSelector } from "../../store/userSelection/app/wizardSelectionSelector/wizardSelectionSelector";
import { AppState } from "../../store/combineReducers";

import { ReactComponent as NextArrow } from "../../assets/nextarrow.svg";
import nextArrow from "../../assets/nextarrow.svg";
import keyUpHandler from "../../utils/keyUpHandler";
import messages from "./messages";
import { sendTelemetry } from "../../utils/extensionService/extensionService";
import { AppContext } from "../../AppContext";
import { useSelector, useDispatch } from "react-redux";
import { setPageWizardPageAction, setVisitedWizardPageAction } from "../../store/navigation/routes/action";
import { getIsVisitedRoutesSelector } from "../../store/config/config/wizardNavigationSelector";
import { useMemo } from "react";
import { setIsDirtyAction } from "../../store/navigation/isDirty/action";
import { EXTENSION_COMMANDS } from "../../utils/constants/commands";

type Props = InjectedIntlProps;

const pathsNext: any = {
  [ROUTES.NEW_PROJECT]: ROUTES.SELECT_FRAMEWORKS,
  [ROUTES.SELECT_FRAMEWORKS]: ROUTES.SELECT_PAGES,
  [ROUTES.SELECT_PAGES]: ROUTES.ADD_SERVICES,
  [ROUTES.ADD_SERVICES]: ROUTES.REVIEW_AND_GENERATE,
};
const pathsBack: any = {
  [ROUTES.SELECT_FRAMEWORKS]: ROUTES.NEW_PROJECT,
  [ROUTES.SELECT_PAGES]: ROUTES.SELECT_FRAMEWORKS,
  [ROUTES.ADD_SERVICES]: ROUTES.SELECT_PAGES,
  [ROUTES.REVIEW_AND_GENERATE]: ROUTES.ADD_SERVICES,
};

const Footer = (props: Props) => {
  const { formatMessage } = props.intl;

  const visitedRoutes = useSelector((state: AppState) => getIsVisitedRoutesSelector(state));
  const isEnableNextPage = useSelector((state: AppState) => isEnableNextPageSelector(state));
  const currentRoute = useSelector((state: AppState) => state.navigation.routes.selected);
  const isEnableGenerateButton = useSelector((state: AppState) => isEnableGenerateButtonSelector(state));
  const vscode: IVSCodeObject = React.useContext(AppContext).vscode;
  const isFirstStep = useMemo(() => currentRoute === ROUTES.NEW_PROJECT, [currentRoute]);
  const isLastStep = useMemo(() => currentRoute === ROUTES.REVIEW_AND_GENERATE, [currentRoute]);

  const dispatch = useDispatch();

  const trackPageForTelemetry = (pathname: string) => {
    sendTelemetry(vscode, EXTENSION_COMMANDS.TRACK_PAGE_SWITCH, {
      pageName: pathname,
    });
  };

  const generateProject = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    trackPageForTelemetry(currentRoute);
    dispatch(openGenModalAction());
    dispatch(setIsDirtyAction(false));
  };

  const navigateBack = () => {
    trackPageForTelemetry(currentRoute);
    dispatch(setPageWizardPageAction(pathsBack[currentRoute]));
    dispatch(setIsDirtyAction(true));
  };

  const navigateForward = () => {
    trackPageForTelemetry(currentRoute);
    dispatch(setVisitedWizardPageAction(pathsNext[currentRoute]));
    dispatch(setPageWizardPageAction(pathsNext[currentRoute]));
    dispatch(setIsDirtyAction(true));
  };

  const navigateForwardOnKeyPress = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    if (event.key === KEY_EVENTS.ENTER || event.key === KEY_EVENTS.SPACE) {
      navigateForward();
    }
  };

  const navigateBackOnKeyPress = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    if (event.key === KEY_EVENTS.ENTER || event.key === KEY_EVENTS.SPACE) {
      navigateBack();
    }
  };

  const showLicenses = (): boolean => {
    return visitedRoutes.showFrameworks;
  };

  return (
    <nav aria-label={formatMessage(messages.navAriaLabel)}>
      {currentRoute !== ROUTES.PAGE_DETAILS && (
        <div className={styles.footer}>
          <div>{showLicenses() && formatMessage(messages.license)}</div>
          <div className={styles.buttonContainer}>
              <a
                tabIndex={!isFirstStep ? 0 : -1}
                className={classnames(buttonStyles.buttonDark, styles.button, styles.buttonBack,
                  {
                    [styles.disabledOverlay]: isFirstStep
                  })}
                onClick={() => { if (!isFirstStep) navigateBack() }}
                onKeyPress={(event) => { if (!isFirstStep) navigateBackOnKeyPress(event) }}
                onKeyUp={(event: React.KeyboardEvent<HTMLAnchorElement>) => { if (!isFirstStep) keyUpHandler(event) }}
              >
                {formatMessage(messages.back)}
              </a>
              <a
                tabIndex={isEnableNextPage ? 0 : -1}
                className={classnames(styles.button, styles.buttonNext, buttonStyles.buttonHighlighted, {
                  [buttonStyles.buttonDark]: !isEnableNextPage,
                  [styles.disabledOverlay]: isLastStep || !isEnableNextPage
                })}
                onClick={() => { if (!isLastStep && isEnableNextPage) navigateForward()}}
                onKeyPress={(event) => { if (!isLastStep) navigateForwardOnKeyPress(event)}}
                onKeyUp={(event: React.KeyboardEvent<HTMLAnchorElement>) => { if (!isLastStep) keyUpHandler(event) }}
              >
                {formatMessage(messages.next)}
                {nextArrow && (
                  <NextArrow
                    className={classnames(styles.nextIcon, {
                      [styles.nextIconNotDisabled]: isEnableNextPage,
                    })}
                  />
                )}
              </a>
            <button
              disabled={!isEnableGenerateButton}
              className={classnames(styles.button, {
                [buttonStyles.buttonDark]: !isEnableGenerateButton,
                [buttonStyles.buttonHighlighted]: isEnableGenerateButton,
                [styles.disabledOverlay]: !isEnableGenerateButton,
              })}
              onClick={generateProject}
            >
              {formatMessage(messages.generate)}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default injectIntl(Footer);