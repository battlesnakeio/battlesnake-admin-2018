import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom'
import { userProvider } from './components/data'
import config from './config'
import Team from './Team'
import CreateTeam from './Team/create'
import Admin from './Admin'
import Tournaments from './Tournament'
import 'semantic-ui-css/semantic.min.css'
import './App.css'

const LoginLink = () => <a href={`${config.SERVER}/auth/github`}>Login Here</a>

const LoadingScreen = () => <div>Loading !!1</div>

const ErrorScreen = () => <div>Problems abound ... </div>

const WelcomeScreen = () => <div>Welcome!</div>

/**
 * Things required:
 *  - Loading √
 *  - Error √
 *  - User not logged in
 *  - User logged in, no team
 *  -- ask if wants to be a captain
 *  -- or wait for invitation
 *  - If team captain / team member
 *  -- Team member screen (invite others)
 *  -- Snake management
 */
class App extends Component {
  render () {
    // Loading
    if (this.props.userMgr.loading) {
      return <LoadingScreen />
    }

    // Error
    if (this.props.userMgr.error) {
      return <ErrorScreen />
    }

    // Welcome screen
    if (!this.props.userMgr.loggedIn) {
      return <WelcomeScreen />
    }

    // Finally - on a team - can edit team, invite members, or leave team
    return (
      <Router>
        <div className="body-wrapper">
          {!this.props.userMgr.loggedIn && <LoginLink />}
          {!this.props.userMgr.user.teamId && <Redirect to="/new-team" />}
          <Route exact path="/" render={() => <Redirect to="/team" />} />
          <Route path="/team" component={Team} />
          <Route path="/new-team" component={CreateTeam} />
          <Route path="/swu" component={Admin} />
          <Route path="/tournament" component={Tournaments} />
        </div>
      </Router>
    )
  }
}

export default userProvider(App)
