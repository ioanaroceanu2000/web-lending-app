import React, {Component} from 'react';
import {Container, Row, Col, Form} from 'react-bootstrap';
import './DepositView.css';
import {deposit, redeem,borrow,depositCollateral, getAccount} from './utils.js';




class ActionView extends Component {

  constructor(props) {
    // props: tokens list {fakeID, realID, symbol}
    // props: type = ["Deposit", "Borrow", "Collateral", "Redeem", "Repay"]
    // props: web3
    // props: liquidityPool
    // props: prices fakeID->price
    super(props);
    this.state = {
      toBeAdded: '0xb6186735ed018f39b1c7dc07644227a5b28a68dd', //->fakeID (YFI)
      amountToTransfer: 0,
      amountToTransferUSD: 0,
      toBeAddedColl: '0xb6186735ed018f39b1c7dc07644227a5b28a68dd',
      amountToTransferColl: 0,
      amountToTransferUSDColl: 0,
    };
  }

  // this is for the second form from the collateral view
  handleChangeSelectedToken_Coll = (e) => {
    this.setState({ toBeAddedColl: e.target.value });
  }
  // this is for the second form from the collateral view
  handleChangeAmount_Coll = (e) => {
    this.setState({ amountToTransferColl: e.target.value });
    if(this.state.toBeAdded != ""){
      console.log("now I am attempting to change value");
      const price = this.props.prices[this.state.toBeAddedColl];
      const valueUSD = price*e.target.value;
      this.setState({amountToTransferUSDColl: valueUSD.toFixed(2)});
    }
  }

  handleChangeSelectedToken = (e) => {
    this.setState({ toBeAdded: e.target.value });
  }

  handleChangeAmount = (e) => {
    this.setState({ amountToTransfer: e.target.value });
    if(this.state.toBeAdded != ""){
      const price = this.props.prices[this.state.toBeAdded];
      const valueUSD = price*e.target.value;
      this.setState({amountToTransferUSD: valueUSD.toFixed(2)});
    }
  }


  async submitTransaction(){
    const userAccount = await getAccount(this.props.web3);
    if(this.props.type == "Deposit"){
      await deposit(userAccount, this.state.amountToTransfer, this.state.toBeAdded, this.props.web3, this.props.liquidityPool);
    }else if(this.props.type == "Redeem"){
      await redeem(userAccount, this.state.amountToTransfer, this.state.toBeAdded, this.props.web3, this.props.liquidityPool);
    }else if(this.props.type == "Borrow"){
      await borrow(userAccount, this.state.amountToTransfer, this.state.toBeAdded, this.props.web3, this.props.liquidityPool);
    }else if(this.props.type == "Collateral"){
      await depositCollateral(userAccount, this.state.amountToTransfer, this.state.toBeAdded, this.props.web3, this.props.liquidityPool);
    }
  }

  options(size, coll){
    var tokenOptions = [];
    var i =0;
    const len = this.props.tokens.length;
    for(i=0; i < len; i++){
      const fakeId = this.props.tokens[i]["fakeID"];
      const symbol = this.props.tokens[i]["symbol"];
      tokenOptions.push(<option value={fakeId}>{symbol}</option>);
    }
    // this is for the second form from the collateral view
    if(coll){
      return(
        <Form.Group controlId="exampleForm.ControlSelect1" className="topTokenInput">
          <Form.Control size={size} as="select" className="tokenInput" onChange={ this.handleChangeSelectedToken_Coll }>
            {tokenOptions}
          </Form.Control>
        </Form.Group>
      );
    }
    return (
    <Form.Group controlId="exampleForm.ControlSelect1" className="topTokenInput">
      <Form.Control size={size} as="select" className="tokenInput" onChange={ this.handleChangeSelectedToken }>
        {tokenOptions}
      </Form.Control>
    </Form.Group>
  );
  }

  render() {
    const optionsLg = this.options("lg", false);
    const optionsSm = this.options("sm", false);
    const optionsSmColl = this.options("sm", true);
    if(this.props.type == "Collateral"){
      return (
        <div className="container">
        <div>
        <Container>
          <Row>
          <h4>Add Collateral from wallet</h4>
          </Row>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control size="sm" type="email" placeholder="e.g 450" className="valueInput" onChange={ this.handleChangeAmount }/>
              </Form.Group>
              {optionsSm}
            </Form>
          </Row>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control readOnly size="sm" type="email" placeholder={this.state.amountToTransferUSD} className="valueInput"/>
              </Form.Group>

            <Form.Group className="topTokenInput">
              <Form.Control size="sm" className="tokenInput" placeholder="USD" disabled />
            </Form.Group>
            </Form>
          </Row>

          <Row>
            <button type="button" className="collateral-submit" onClick={this.submitTransaction.bind(this)}>Submit Transaction</button>
          </Row>

        </Container>
        </div>

        <hr/>

        <div>
        <Container>
          <Row>
          <h4>Add Collateral from deposit</h4>
          </Row>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control size="sm" type="email" placeholder="e.g 450" className="valueInput" onChange={ this.handleChangeAmount_Coll }/>
              </Form.Group>
              {optionsSm}
            </Form>
          </Row>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control readOnly size="sm" type="email" placeholder={this.state.amountToTransferUSDColl.toString()} className="valueInput"/>
              </Form.Group>

            <Form.Group className="topTokenInput">
              <Form.Control size="sm" className="tokenInput" placeholder="USD" disabled />
            </Form.Group>
            </Form>
          </Row>

          <Row>
            <button type="button" className="collateral-submit">Submit Transaction</button>
          </Row>

        </Container>
        </div>
        </div>
      );
    }else{
      return (
        <div className="container">

        <div>
        <Container>
          <Row>
          <div><br/></div>
          </Row>
          <Row>
          <h3>{this.props.type}</h3>
          </Row>
          <br/>

          <Row>
            <Form className="inputField">
              <Form.Group controlId="formBasicEmail" className="topValueInput">
                <Form.Control size="lg" type="email" placeholder="e.g 450" className="valueInput" onChange={ this.handleChangeAmount }/>
              </Form.Group>
              {optionsLg}
            </Form>
          </Row>

          <Row>
            <Form className="inputField">
            <Form.Group controlId="formBasicEmail" className="topValueInput">
              <Form.Control size="lg" readOnly type="email" placeholder={this.state.amountToTransferUSD.toString()} className="valueInput"/>
            </Form.Group>

            <Form.Group className="topTokenInput">
              <Form.Control size="lg" className="tokenInput" placeholder="USD" disabled />
            </Form.Group>
            </Form>
          </Row>

          <Row>
            <button type="button" className="submitButton" onClick={this.submitTransaction.bind(this)}>Submit Transaction</button>

          </Row>

        </Container>
        </div>

        </div>
      );
    }

  }
}
export default ActionView;
