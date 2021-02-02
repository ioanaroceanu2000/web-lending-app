import React, {Component} from 'react';
import {Container, Row, Col, Navbar, Button} from 'react-bootstrap';
import './ActionButtons.css';
import ActionView from './DepositView.js';

class ActionButtons extends Component {

  constructor(props) {
    super(props);
    this.state = {
      buttonColors: ["#FF66C4", "#FF66C4", "#FF66C4", "#FF66C4", "#FF66C4"],
      actionType: "Deposit",
    };
  }

  modifyStyle(buttonNo){
    const newColors = ["#FF66C4", "#FF66C4", "#FF66C4", "#FF66C4", "#FF66C4"];
    newColors[buttonNo] = "#302f75";
    const action = ["Deposit", "Borrow", "Collateral", "Redeem", "Repay"];
    this.setState({buttonColors: newColors, actionType: action[buttonNo]});
  }


  render() {

    return (
      <div className="container-fluid">
      <Container>
      <Row>
        <Col><button className="button" style={{backgroundColor: this.state.buttonColors[0]}} type="button radio" onClick={(e) => this.modifyStyle(0)}>Deposit</button></Col>
        <Col><button className="button" style={{backgroundColor: this.state.buttonColors[1]}} type="button radio" onClick={(e) => this.modifyStyle(1)}>Borrow</button></Col>
        <Col><button className="button" style={{backgroundColor: this.state.buttonColors[2]}}  type="button radio" onClick={(e) => this.modifyStyle(2)}>Collateral</button></Col>
        <Col><button className="button" style={{backgroundColor: this.state.buttonColors[3]}}  type="button radio" onClick={(e) => this.modifyStyle(3)}>Redeem</button></Col>
        <Col><button className="button" style={{backgroundColor: this.state.buttonColors[4]}}  type="button radio" onClick={(e) => this.modifyStyle(4)}>Repay</button></Col>
      </Row>
      <hr className="hrButtons"/>
      <Row> <ActionView type={this.state.actionType} tokens={this.props.tokens}/> </Row>
      </Container>
      </div>
    );
  }
}
// <!-- <div className="tokens"> {this.renderPrices()} </div> -->
export default ActionButtons;
