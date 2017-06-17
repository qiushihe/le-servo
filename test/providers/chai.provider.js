import _chai from "chai";
import sinonChai from "sinon-chai";
import chaiChange from "chai-change";

_chai.use(sinonChai);
_chai.use(chaiChange);

export default _chai;
