import React, {Component} from 'react';
import './App.css';
import PriceUpdate from './price_update';
import Balance from './Balance.js'
import Web3 from 'web3';
import {Container, Row, Col, Navbar} from 'react-bootstrap';
import logo from './logoTr.png';

class App extends Component {

  componentWillMount(){
    this.leadBlockchainData();
  }

  async leadBlockchainData(){
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
    const network = await web3.eth.net.getNetworkType();
    console.log("network:",network);
  }


  renderPrices() {
    const listTokens = ["ABC", "DEF", "GHI"];
    return (
      <PriceUpdate
        tokens={listTokens}
      />
    );
  }

  renderBalances() {
    return(
      <Balance />
    );
  }

  render() {
    return (
      <div className="container-fluid">
      <Navbar>
        <a className="navbar-brand" href="#">
          <img src={logo} width="80" height="40" className="d-inline-block align-top" alt="" />
        </a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarCollapse">
          <ul className="navbar-nav">
            <li className="nav-item active">
              <a className="nav-link" href="#">Home <span class="sr-only">(current)</span></a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Features</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Pricing</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Disabled</a>
            </li>
          </ul>
        </div>
      </Navbar>

        <Container className="container">
          <Row className="rows">
            <Col className="columns columns-left" lg={4}>
            <br/>
            <h3>Your Balance</h3>
            <hr/>
            <div> {this.renderBalances()} </div>
            </Col>
            <Col className="columns columns-right" lg={7}>Action</Col>
          </Row>
        </Container>


      </div>
    );
  }
}
// <!-- <div className="tokens"> {this.renderPrices()} </div> -->
export default App;
