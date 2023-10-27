import { doStartSession } from '../startSession.mjs';
import { expect } from 'chai';
import sinon from 'sinon';

describe('doStartSession unit tests', () => {
    const event = {};

    afterEach(()=>{
        sinon.restore();
    })

    it('should return a successful response with CST and TOKEN values', async () => {
        // -> GIVEN
        sinon.stub(global, 'fetch').callsFake(() => new Response({}, {
          status: 200,
          headers: {
            CST: '1234567890',
            'X-SECURITY-TOKEN': 'qwertyuiopasdfghjkl'
          }
        }));
        // -> WHEN
        const result = await doStartSession(event, 'http://endpoint.com', 'DEMO-KEY', 'name@email.com', 'abc-123-!');
        
        // -> THEN
        expect(result.session.CST).to.equal('1234567890');
        expect(result.session.TOKEN).to.equal('qwertyuiopasdfghjkl');
      });
})
