import React, {Component} from 'react';
import './Balance.css';
import PriceUpdate from './price_update';
import Web3 from 'web3';
import {Container, Row, Col, Navbar} from 'react-bootstrap';
import logo from './logo.png';


class Balance extends Component {

  /*componentWillMount(){
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
  }*/

  render() {
    return (
      <div className="container">

      <div className="box">
      <Container className="container">
        <Row className="rows">
          <Col sm={4}>
            <div className="action-name">Deposit:</div>
          </Col>
          <Col sm={8} >
            <div className="deposit-value">$30000</div>
            <div className="deposit-token">34 ETH</div>
          </Col>
        </Row>
      </Container>


      </div>
      <div className="box">
      <Container className="container">

        <h4 className="loan-heading">Loan</h4>
        <hr/>
        <Row>
          <Col sm={4}>
            <div className="action-name">Collateral:</div>
          </Col>
          <Col sm={8} >
            <div className="deposit-value">$10000</div>
            <div className="deposit-token">34 ETH</div>
          </Col>
        </Row>
        <Row>
          <Col sm={4}>
            <div className="action-name">Owed:</div>
          </Col>
          <Col sm={8} >
            <div className="deposit-value">$103</div>
            <div className="deposit-token">100 DAI</div>
          </Col>
        </Row>

      </Container>
      </div>
      </div>
    );
  }
}
export default Balance;
