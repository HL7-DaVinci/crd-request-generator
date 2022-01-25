import React, {Component} from 'react';
import FHIR from "fhirclient";
import styles from './card-list.css';
import Button from 'terra-button';
import TerraCard from 'terra-card';
import Text from 'terra-text';
import PropTypes from 'prop-types';
import axios from 'axios';
import SMARTBox from '../SMARTBox/SMARTBox';
import ReactMarkdown from 'react-markdown';
import './displayBox.css';

const propTypes = {
    /**
     * A boolean to determine if the context of this component is under the Demo Card feature of the Sandbox, or in the actual
     * hook views that render cards themselves. This flag is necessary to make links and suggestions unactionable in the Card Demo view.
     */
    isDemoCard: PropTypes.bool,
    /**
     * The FHIR access token retrieved from the authorization server. Used to retrieve a launch context for a SMART app
     */
    fhirAccessToken: PropTypes.object,
    /**
     * Function callback to take a specific suggestion from a card
     */
    takeSuggestion: PropTypes.func.isRequired,
    /**
     * Identifier of the Patient resource for the patient in context
     */
    patientId: PropTypes.string,
    /**
     * The FHIR server URL in context
     */
    fhirServerUrl: PropTypes.string,
    /**
     * The FHIR version in use
     */
    fhirVersion: PropTypes.string,
    /**
     * JSON response from a CDS service containing potential cards to display
     */
    cardResponses: PropTypes.object,
  };

export default class DisplayBox extends Component{
    constructor(props){
        super(props);
        this.launchLink = this.launchLink.bind(this);
        this.launchSource = this.launchSource.bind(this);
        this.renderSource = this.renderSource.bind(this);
        this.modifySmartLaunchUrls = this.modifySmartLaunchUrls.bind(this);
        this.retrieveLaunchContext = this.retrieveLaunchContext.bind(this);
        this.exitSmart = this.exitSmart.bind(this);
        this.state={
            value: "",
            smartLink: "",
            response: {}
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if(JSON.stringify(nextProps.response) !== JSON.stringify(prevState.response)) {
            return {"response":nextProps.response}
        }else{ 
            return null;
        }
    }

    shouldComponentUpdate(nextProps, prevState) {
        if(JSON.stringify(nextProps.response) !== JSON.stringify(this.state.response) || this.state.smartLink !== prevState.smartLink) {
            return true;
        }else{
            return false;
        }
    }
  /**
   * Take a suggestion from a CDS service based on action on from a card. Also pings the analytics endpoint (if any) of the
   * CDS service to notify that a suggestion was taken
   * @param {*} suggestion - CDS service-defined suggestion to take based on CDS Hooks specification
   * @param {*} url - CDS service endpoint URL
   */
  takeSuggestion(suggestion, url, buttonId) {
    if (!this.props.isDemoCard) {
      console.log("taking suggestion");

      // disable the button
      document.getElementById(buttonId).setAttribute("disabled", "true");

      if (suggestion.label) {
        if (suggestion.uuid) {
          axios({
            method: 'POST',
            url: `${url}/analytics/${suggestion.uuid}`,
            data: {},
          });
        }

        const client = FHIR.client({
          serverUrl: this.props.ehrUrl,
          tokenResponse: {
            access_token: this.props.access_token.access_token,
          },
        });

        // handle each action from the suggestion
        suggestion.actions.forEach((action) => {
          if (action.type.toUpperCase() === "DELETE") {
            var uri = action.resource.resourceType + "/" + action.resource.id;
            console.log("completing suggested action DELETE: " + uri);
            client.delete(uri).then((result) => {
              console.log("suggested action DELETE result:");
              console.log(result);
            });

          } else if (action.type.toUpperCase() === "CREATE") {
            var uri = action.resource.resourceType;
            console.log("completing suggested action CREATE: " + uri);
            client.create(action.resource).then((result) => {
              console.log("suggested action CREATE result:");
              console.log(result);

              // call into the request builder to resubmit the CRD request with the suggested request
              this.props.takeSuggestion(result);
            });

          } else if (action.type.toUpperCase() === "UPDATE") {
            var uri = action.resource.resourceType + "/" + action.resource.id;
            console.log("completing suggested action UPDATE: " + uri);
            client.update(action.resource).then((result) => {
              console.log("suggested action UPDATE result:");
              console.log(result);
            });

          } else {
            console.log("WARNING: unknown action");
          }
        });

      } else {
        console.error('There was no label on this suggestion', suggestion);
      }
    }
  }

  /**
   * Prevent the source link from opening in the same tab
   * @param {*} e - Event emitted when source link is clicked
   */
  launchSource(e) {
    e.preventDefault();
  }

  exitSmart(e) {
    this.setState({"smartLink":""});
  }
  /**
   * Open the absolute or SMART link in a new tab and display an error if a SMART link does not have
   * appropriate launch context if used against a secured FHIR endpoint.
   * @param {*} e - Event emitted when link is clicked
   * @param {*} link - Link object that contains the URL and any error state to catch
   */
  launchLink(e, link) {
    if (!this.props.isDemoCard) {
      e.preventDefault();
      if (link.error) {
        // TODO: Create an error modal to display for SMART link that cannot be launched securely
        return;
      }
        window.open(link.url, '_blank');

    }
  }

  /**
   * For SMART links, modify the link URLs as this component processes them according to two scenarios:
   * 1 - Secured: Retrieve a launch context for the link and append a launch and iss parameter for use against secured endpoints
   * 2 - Open: Append a fhirServiceUrl and patientId parameter to the link for use against open endpoints
   * @param {*} card - Card object to process the links for
   */
  modifySmartLaunchUrls(card) {
    if (!this.props.isDemoCard) {
      return card.links.map((link) => {
        let linkCopy = Object.assign({}, link);

        if (link.type === 'smart' && (this.props.fhirAccessToken || this.props.ehrLaunch) && !this.state.smartLink) {
          this.retrieveLaunchContext(
            linkCopy, this.props.fhirAccessToken,
            this.props.patientId, this.props.fhirServerUrl, this.props.fhirVersion
          ).then((result) => {
            linkCopy = result;
            return linkCopy;
          });
        } else if (link.type === 'smart') {
          if (link.url.indexOf('?') < 0) {
            linkCopy.url += '?';
          } else {
            linkCopy.url += '&';
          }
          //linkCopy.url += `fhirServiceUrl=${this.props.fhirServerUrl}`;
          //linkCopy.url += `&patientId=${this.props.patientId}`;
        }
        return linkCopy;
      });
    }
    return undefined;
  }

  /**
 * Retrieves a SMART launch context from an endpoint to append as a "launch" query parameter to a SMART app launch URL (see SMART docs for more about launch context).
 * This applies mainly if a SMART app link on a card is to be launched. The link needs a "launch" query param with some opaque value from the SMART server entity.
 * This function generates the launch context (for HSPC Sandboxes only) for a SMART application by pinging a specific endpoint on the FHIR base URL and returns
 * a Promise to resolve the newly modified link.
 * @param {*} link - The SMART app launch URL
 * @param {*} accessToken - The access token provided to the CDS Hooks Sandbox by the FHIR server
 * @param {*} patientId - The identifier of the patient in context
 * @param {*} fhirBaseUrl - The base URL of the FHIR server in context
 */
retrieveLaunchContext(link, accessToken, patientId, fhirBaseUrl, fhirVersion) {
    return new Promise((resolve, reject) => {
      const headers = accessToken ?
      {
        "Accept": 'application/json',
        "Authorization": `Bearer ${accessToken.access_token}`
      }
      :
      {        
        "Accept": 'application/json'
      };
      const launchParameters = {
        patient: patientId,
      };
  
      if (link.appContext) {
        launchParameters.appContext = link.appContext;
      }
  
      // May change when the launch context creation endpoint becomes a standard endpoint for all EHR providers
      axios({
        method: 'post',
        url: `${fhirBaseUrl}/_services/smart/Launch`,
        headers,
        data: {
          launchUrl: link.url,
          parameters: launchParameters,
        },
      }).then((result) => {
        if (result.data && Object.prototype.hasOwnProperty.call(result.data, 'launch_id')) {
          if (link.url.indexOf('?') < 0) {
            link.url += '?';
          } else {
            link.url += '&';
          }
          link.url += `launch=${result.data.launch_id}`;
          link.url += `&iss=${fhirBaseUrl}`;
          return resolve(link);
        }
        console.error('FHIR server endpoint did not return a launch_id to launch the SMART app. See network calls to the Launch endpoint for more details');
        link.error = true;
        return reject(link);
      }).catch((err) => {
        console.error('Cannot grab launch context from the FHIR server endpoint to launch the SMART app. See network calls to the Launch endpoint for more details', err);
        link.error = true;
        return reject(link);
      });
    });
  }

  /**
   * Helper function to build out the UI for the source of the Card
   * @param {*} source - Object as part of the card to build the UI for
   */
    renderSource(source) {
        if (!source.label) { return null; }
        let icon;
        if (source.icon) {
          icon = <img className={styles['card-icon']} src={source.icon} alt="Could not fetch icon" width="100" height="100" />;
        }
        if (!this.props.isDemoCard) {
          return (
            <div className={styles['card-source']}>
              Source: <a className={styles['source-link']} href={source.url || '#'} onClick={e => this.launchSource(e)}>{source.label}</a>
              {icon}
            </div>
          );
        }
        return (
          <div className={styles['card-source']}>
            Source:
            <a // eslint-disable-line jsx-a11y/anchor-is-valid
              className={styles['source-link']}
              href="#"
              onClick={e => this.launchSource(e)}
            >
              {source.label}
            </a>
            {icon}
          </div>
        );
      }
    render() {
        const indicators = {
            info: 0,
            warning: 1,
            'hard-stop': 2,
            error: 3,
          };
      
          const summaryColors = {
            info: '#0079be',
            warning: '#ffae42',
            'hard-stop': '#c00',
            error: '#333',
          };
          const renderedCards = [];
          // Iterate over each card in the cards array
          if(this.state.response!=null && this.state.response.cards!=null){
            this.state.response.cards
            .sort((b, a) => indicators[a.indicator] - indicators[b.indicator])
            .forEach((c, cardInd) => {
              const card = JSON.parse(JSON.stringify(c));
      
              // -- Summary --
              const summarySection = <Text fontSize={18} weight={700} color={summaryColors[card.indicator]}>{card.summary}</Text>;

              // -- Source --
              const sourceSection = card.source && Object.keys(card.source).length ? this.renderSource(card.source) : '';

              // -- Detail (ReactMarkdown supports Github-flavored markdown) --
              const detailSection = card.detail ? <div style={{color: summaryColors.info}}><ReactMarkdown source={card.detail} /></div> : <Text color='grey'>None</Text>;
      
              // -- Suggestions --
              let suggestionsSection;
              if (card.suggestions) {
                var buttonId = "suggestion_button-"+cardInd;
                suggestionsSection = card.suggestions.map((item, ind) => (
                  <Button
                    key={ind}
                    onClick={() => this.takeSuggestion(item, card.serviceUrl, buttonId+"-"+ind)}
                    text={item.label}
                    variant={Button.Opts.Variants.EMPHASIS}
                    id={buttonId+"-"+ind}
                  />
                ));
              }
      
              // -- Links --
              let linksSection;
              if (card.links) {
                card.links = this.modifySmartLaunchUrls(card) || card.links;
                linksSection = card.links.map((link, ind) => (
                  <Button
                    key={ind}
                    onClick={e => this.launchLink(e, link)}
                    text={link.label}
                    variant={Button.Opts.Variants['DE-EMPHASIS']}
                  />
                ));
              }

              // -- Type --
              var typeSection = "";
              if (card.source.hasOwnProperty("topic")) {
                typeSection = card.source.topic.display ? <div style={{color: summaryColors.info}}><ReactMarkdown source={card.source.topic.display} /></div> : <Text color='grey'>None</Text>;
              }
    
              const cardSectionHeaderStyle = { marginBottom: '2px', color: 'black' };

              const builtCard = (
                <TerraCard key={cardInd} className='decision-card alert-info'>
                  <h4 style={cardSectionHeaderStyle}>Summary</h4>
                  <div>{summarySection}</div>

                  <h4 style={cardSectionHeaderStyle}>Details</h4>
                  <div>{detailSection}</div>

                  <br/>
                  <div>{sourceSection}</div>

                  <div className={styles['suggestions-section']}>
                    {suggestionsSection}
                  </div>
                  <div className={styles['links-section']}>
                    {linksSection}
                  </div>
                  <h4 style={cardSectionHeaderStyle}>Type</h4>
                  <div>{typeSection}</div>
                </TerraCard>);
      
              renderedCards.push(builtCard);
            });
          }
          if (renderedCards.length === 0) { return <div><div className='decision-card alert-warning'>No Cards</div></div>; }
          return <div>
                  <div>
                  {renderedCards}
                  </div>
                </div>;
        }
      }
