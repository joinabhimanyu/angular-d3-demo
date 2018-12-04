import { MsSharePage } from './app.po';

describe('neuro-share App', () => {
  let page: MsSharePage;

  beforeEach(() => {
    page = new MsSharePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
