import {css} from 'aphrodite-local-styles/no-important';
import PropTypes from 'prop-types';
import React from 'react';
import FontAwesome from 'react-fontawesome';
import {createFragmentContainer} from 'react-relay';
import Button from 'universal/components/Button/Button';
import Panel from 'universal/components/Panel/Panel';
import withSubscriptions from 'universal/decorators/withSubscriptions.js/withSubscriptions';
import AddGitHubRepo from 'universal/modules/teamDashboard/AddGitHubRepo/AddGitHubRepo';
import GitHubRepoRow from 'universal/modules/teamDashboard/components/GItHubRepoRow';
import IntegrationsNavigateBack from 'universal/modules/teamDashboard/components/IntegrationsNavigateBack/IntegrationsNavigateBack';
import {providerLookup} from 'universal/modules/teamDashboard/components/ProviderRow/ProviderRow';
import RemoveProviderMutation from 'universal/mutations/RemoveProviderMutation';
import ui from 'universal/styles/ui';
import withStyles from 'universal/styles/withStyles';
import GitHubRepoAddedSubscription from 'universal/subscriptions/GitHubRepoAddedSubscription';
import GitHubRepoRemovedSubscription from 'universal/subscriptions/GitHubRepoRemovedSubscription';
import ProviderAddedSubscription from 'universal/subscriptions/ProviderAddedSubscription';
import ProviderRemovedSubscription from 'universal/subscriptions/ProviderRemovedSubscription';
import {GITHUB} from 'universal/utils/constants';
import IntegrationJoinedSubscription from 'universal/subscriptions/IntegrationJoinedSubscription';
import IntegrationLeftSubscription from 'universal/subscriptions/IntegrationLeftSubscription';

const {makeUri} = providerLookup[GITHUB];

const GitHubIntegrations = (props) => {
  const {relay: {environment}, jwt, styles, teamId, viewer} = props;
  const {id: viewerId, githubRepos, integrationProvider} = viewer;
  const accessToken = integrationProvider && integrationProvider.accessToken;
  const openOauth = () => {
    const uri = makeUri(jwt, teamId);
    window.open(uri);
  };
  return (
    <div className={css(styles.githubIntegrations)}>
      <IntegrationsNavigateBack teamId={teamId}/>
      {/* TODO: see if we can share this with ProviderIntegrationRow even though it has a Link component */}
      <div className={css(styles.providerDetails)}>
        <div className={css(styles.providerAvatar)}>
          <FontAwesome name="github" className={css(styles.providerIcon)}/>
        </div>
        <div className={css(styles.providerInfo)}>
          <div className={css(styles.nameAndTags)}>
            <div className={css(styles.providerName)}>
              {ui.providers.github.providerName}
            </div>
            <div className={css(styles.subHeading)}>
              {ui.providers.github.description}
            </div>
          </div>
        </div>
        {accessToken &&
        <div className={css(styles.providerActions)}>
          <Button
            buttonStyle="flat"
            colorPalette="warm"
            label="Remove GitHub"
            onClick={() => RemoveProviderMutation(environment, integrationProvider.id, GITHUB, teamId, viewerId)}
            sansPaddingX
            size="smallest"
          />
          <Button
            buttonStyle="flat"
            colorPalette="cool"
            label="Refresh Token"
            onClick={openOauth}
            sansPaddingX
            size="smallest"
          />
        </div>
        }
      </div>
      <Panel label="Repositories">
        <div className={css(styles.integrations)}>
          {accessToken ?
            <div className={css(styles.addRepo)}>
              <AddGitHubRepo
                accessToken={accessToken}
                environment={environment}
                teamId={teamId}
                viewerId={viewer.id}
                subbedRepos={githubRepos}
              />
            </div> :
            <div className={css(styles.addGitHub)}>
              <Button
                buttonStyle="solid"
                colorPalette="cool"
                label="Authorize GitHub to Add a Repo"
                onClick={openOauth}
                size="medium"
              />
            </div>
          }
          {githubRepos &&
          <div className={css(styles.integrationsList)}>
            {githubRepos.map((repo) => (
              <GitHubRepoRow
                accessToken={accessToken}
                key={repo.id}
                repo={repo}
                environment={environment}
                viewerId={viewerId}
                teamId={teamId}
              />
            ))}
          </div>
          }
        </div>
      </Panel>
    </div>
  );
};

GitHubIntegrations.propTypes = {
  jwt: PropTypes.string.isRequired,
  relay: PropTypes.object.isRequired,
  viewer: PropTypes.object.isRequired,
  styles: PropTypes.object,
  teamId: PropTypes.string.isRequired
};

const styleThunk = () => ({
  githubIntegrations: {
    maxWidth: ui.settingsPanelMaxWidth,
    width: '100%'
  },

  providerDetails: {
    alignItems: 'center',
    display: 'flex'
  },

  providerAvatar: {
    backgroundColor: ui.providers.github.color,
    borderRadius: ui.providerIconBorderRadius
  },

  providerName: {
    ...ui.providerName
  },

  providerIcon: {
    alignItems: 'center',
    color: '#fff',
    display: 'flex !important',
    fontSize: `${ui.iconSize2x} !important`,
    height: ui.providerIconSize,
    justifyContent: 'center',
    width: ui.providerIconSize
  },

  providerInfo: {
    paddingLeft: ui.rowGutter
  },

  providerActions: {
    display: 'flex',
    justifyContent: 'space-around',
    flex: 1,
    paddingLeft: ui.rowGutter,
    textAlign: 'right'
  },

  subHeading: {
    ...ui.rowSubheading
  },

  addGitHub: {
    paddingBottom: ui.rowGutter,
    textAlign: 'center'
  },

  addRepo: {
    borderTop: `1px solid ${ui.rowBorderColor}`,
    display: 'flex',
    padding: ui.rowGutter
  },

  integrationsList: {
    paddingLeft: ui.rowGutter
  },

  nameWithOwner: {
    color: ui.palette.cool,
    fontWeight: 700
  }
});

const subscriptionThunk = ({teamId, viewer: {id}}) => {
  return [
    GitHubRepoAddedSubscription(teamId, id),
    GitHubRepoRemovedSubscription(teamId, id),
    ProviderRemovedSubscription(teamId, id),
    ProviderAddedSubscription(teamId, id),
    IntegrationJoinedSubscription(GITHUB, teamId, id),
    IntegrationLeftSubscription(GITHUB, teamId, id)
  ];
};

export default createFragmentContainer(
  withSubscriptions(subscriptionThunk)(withStyles(styleThunk)(GitHubIntegrations)),
  graphql`
    fragment GitHubIntegrations_viewer on User {
      id
      integrationProvider(teamId: $teamId, service: $service) {
        id
        accessToken
      }
      githubRepos(teamId: $teamId) {
        id
        nameWithOwner
        teamMembers {
          id
          preferredName
          picture
        }
      }
    }
  `
);
